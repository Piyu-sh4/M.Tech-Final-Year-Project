const crypto = require("node:crypto");
const { query, transaction } = require("./database");
const database = require("../config/db");
const failure = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
async function ensure(connection) {
  await query(
    connection,
    `CREATE TABLE IF NOT EXISTS passkey_credentials(credential_id VARCHAR(1024) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,user_id INT NOT NULL,rp_id VARCHAR(255) NOT NULL,public_key TEXT NOT NULL,counter BIGINT UNSIGNED NOT NULL DEFAULT 0,transports TEXT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE)`,
  );
  await query(
    connection,
    `CREATE TABLE IF NOT EXISTS passkey_challenges(challenge_id CHAR(36) PRIMARY KEY,user_id INT NOT NULL,purpose VARCHAR(30) NOT NULL,challenge VARCHAR(255) NOT NULL,origin VARCHAR(500) NOT NULL,rp_id VARCHAR(255) NOT NULL,expires_at DATETIME NOT NULL,FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE)`,
  );
  await query(
    connection,
    `CREATE TABLE IF NOT EXISTS attendance_proofs(token_hash CHAR(64) PRIMARY KEY,user_id INT NOT NULL,action VARCHAR(20) NOT NULL,expires_at DATETIME NOT NULL,FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE)`,
  );
}
/** Bind signatures to our configured website, not a caller-supplied Host header. */
function relyingParty(request) {
  const origin = request.headers.origin;
  const allowed = (
    process.env.APP_ORIGINS ||
    "https://workforce.bharatmedha.com,http://localhost:5500,http://localhost:5503"
  ).split(",");
  if (!allowed.includes(origin))
    throw failure(
      "Open the application on its HTTPS domain or configured localhost address.",
    );
  return { origin, rpID: new URL(origin).hostname };
}
async function options(request, user, purpose) {
  const server = require("@simplewebauthn/server");
  const { origin, rpID } = relyingParty(request);
  const credentials = await query(
    database,
    "SELECT credential_id,transports FROM passkey_credentials WHERE user_id=? AND rp_id=?",
    [user.user_id, rpID],
  );
  const descriptors = credentials.map((credential) => ({
    id: credential.credential_id,
    transports: JSON.parse(credential.transports || "[]"),
  }));
  if (purpose !== "register" && !credentials.length)
    throw failure(
      "No passkey is enrolled for this account on this website. Sign in with a password and enroll in settings.",
    );
  const publicOptions =
    purpose === "register"
      ? await server.generateRegistrationOptions({
          rpName: process.env.COMPANY_NAME || "Workforce Intelligence",
          rpID,
          userID: Buffer.from(String(user.user_id)),
          userName: user.email,
          attestationType: "none",
          supportedAlgorithmIDs: [-7, -257],
          excludeCredentials: descriptors,
          authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "required",
          },
        })
      : await server.generateAuthenticationOptions({
          rpID,
          allowCredentials: descriptors,
          userVerification: "required",
        });
  const challengeId = crypto.randomUUID();
  await query(
    database,
    "DELETE FROM passkey_challenges WHERE expires_at<NOW()",
  );
  await query(
    database,
    "INSERT INTO passkey_challenges(challenge_id,user_id,purpose,challenge,origin,rp_id,expires_at) VALUES (?,?,?,?,?,?,DATE_ADD(NOW(),INTERVAL 5 MINUTE))",
    [challengeId, user.user_id, purpose, publicOptions.challenge, origin, rpID],
  );
  return { challengeId, options: publicOptions };
}
/** Each challenge is consumed once, even when verification fails. */
async function verify(request, purpose, userId) {
  const challenge = await transaction(async (run) => {
    const [stored] = await run(
      "SELECT * FROM passkey_challenges WHERE challenge_id=? AND purpose=? AND expires_at>NOW() FOR UPDATE",
      [request.body.challengeId, purpose],
    );
    if (!stored || (userId && stored.user_id !== userId))
      throw failure("This verification expired. Start again.");
    await run("DELETE FROM passkey_challenges WHERE challenge_id=?", [
      stored.challenge_id,
    ]);
    return stored;
  });
  if (request.headers.origin !== challenge.origin)
    throw failure("Website origin does not match the verification request.");
  const response = request.body.response;
  if (!response || typeof response.id !== "string" || response.id.length > 1024)
    throw failure("An authenticator response is required.");
  const server = require("@simplewebauthn/server");
  try {
    if (purpose === "register") {
      const result = await server.verifyRegistrationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: challenge.origin,
        expectedRPID: challenge.rp_id,
        requireUserVerification: true,
      });
      if (!result.verified || !result.registrationInfo)
        throw failure("Device verification failed.");
      const credential = result.registrationInfo.credential;
      await query(
        database,
        "INSERT INTO passkey_credentials(credential_id,user_id,rp_id,public_key,counter,transports) VALUES (?,?,?,?,?,?)",
        [
          credential.id,
          challenge.user_id,
          challenge.rp_id,
          Buffer.from(credential.publicKey).toString("base64"),
          credential.counter,
          JSON.stringify(credential.transports || []),
        ],
      );
    } else {
      const [credential] = await query(
        database,
        "SELECT * FROM passkey_credentials WHERE credential_id=? AND user_id=? AND rp_id=?",
        [response.id, challenge.user_id, challenge.rp_id],
      );
      if (!credential)
        throw failure("This passkey is not enrolled for this account.");
      const result = await server.verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: challenge.origin,
        expectedRPID: challenge.rp_id,
        requireUserVerification: true,
        credential: {
          id: credential.credential_id,
          publicKey: new Uint8Array(
            Buffer.from(credential.public_key, "base64"),
          ),
          counter: Number(credential.counter),
          transports: JSON.parse(credential.transports || "[]"),
        },
      });
      if (!result.verified) throw failure("Device verification failed.");
      await query(
        database,
        "UPDATE passkey_credentials SET counter=GREATEST(counter,?) WHERE credential_id=?",
        [result.authenticationInfo.newCounter, credential.credential_id],
      );
    }
  } catch (error) {
    if (error.status) throw error;
    throw failure(
      "The authenticator response could not be verified. Start again.",
    );
  }
  const [user] = await query(
    database,
    "SELECT * FROM users WHERE user_id=? AND status='active'",
    [challenge.user_id],
  );
  if (!user) throw failure("This account is not active.", 401);
  return user;
}
async function attendanceGuard(request, response, next) {
  try {
    const [permission] = await query(
      database,
      "SELECT can_clock_in_out FROM user_permissions WHERE user_id=?",
      [request.user.user_id],
    );
    if (request.user.role_id !== 1 && permission?.can_clock_in_out === 0)
      throw failure("Attendance clocking is disabled for this account.", 403);
    if (request.body?.verification_method === "passkey") {
      const action = request.path.endsWith("clock-in")
        ? "clock_in"
        : "clock_out";
      const token = request.body.verification_token;
      if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
        throw failure(
          "Verify with your device before clocking attendance.",
          403,
        );
      const result = await query(
        database,
        "DELETE FROM attendance_proofs WHERE token_hash=? AND user_id=? AND action=? AND expires_at>NOW()",
        [hash(token), request.user.user_id, action],
      );
      if (!result.affectedRows)
        throw failure(
          "Attendance verification expired or was already used.",
          403,
        );
    }
    next();
  } catch (error) {
    next(error);
  }
}
module.exports = { ensure, options, verify, attendanceGuard, hash };
