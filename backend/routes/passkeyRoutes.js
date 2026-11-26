const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const service = require("../services/passkeys");
const database = require("../config/db");
const { query } = require("../services/database");
const limit = require("../middleware/securityMiddleware").loginRateLimiter;
router.use((request, response, next) => {
  if (JSON.stringify(request.body || {}).length > 200000)
    return response
      .status(413)
      .json({ message: "Authenticator response is too large." });
  next();
});
const handle = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response)).catch(next);
router.post(
  "/login/options",
  limit,
  handle(async (request, response) => {
    const [user] = await query(
      database,
      "SELECT user_id,email FROM users WHERE email=? AND status='active'",
      [String(request.body.email || "").toLowerCase()],
    );
    if (!user)
      return response
        .status(400)
        .json({
          message:
            "Passkey sign-in is unavailable. Use a password or contact your administrator.",
        });
    response.json(await service.options(request, user, "login"));
  }),
);
router.post(
  "/login/verify",
  limit,
  handle(async (request, response) => {
    const user = await service.verify(request, "login");
    const token =
      await require("../controllers/authController").issueVerifiedSession(
        user,
        request,
      );
    response.json({
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id,
      },
    });
  }),
);
router.use(protect);
router.get(
  "/",
  handle(async (request, response) =>
    response.json(
      await query(
        database,
        "SELECT credential_id,rp_id,created_at FROM passkey_credentials WHERE user_id=?",
        [request.user.user_id],
      ),
    ),
  ),
);
router.delete(
  "/:id",
  handle(async (request, response) => {
    const result = await query(
      database,
      "DELETE FROM passkey_credentials WHERE user_id=? AND credential_id=?",
      [request.user.user_id, request.params.id],
    );
    response
      .status(result.affectedRows ? 200 : 404)
      .json({
        message: result.affectedRows ? "Passkey removed" : "Passkey not found",
      });
  }),
);
router.post(
  "/register/options",
  handle(async (request, response) => {
    const [account] = await query(
      database,
      "SELECT password_hash FROM users WHERE user_id=?",
      [request.user.user_id],
    );
    if (
      typeof request.body.password !== "string" ||
      request.body.password.length > 100 ||
      !(await require("bcryptjs").compare(
        request.body.password,
        account.password_hash,
      ))
    )
      return response
        .status(403)
        .json({ message: "Confirm your current password to enroll a device." });
    response.json(await service.options(request, request.user, "register"));
  }),
);
router.post(
  "/register/verify",
  handle(async (request, response) => {
    await service.verify(request, "register", request.user.user_id);
    response.json({
      message:
        "Passkey enrolled. Your device keeps its biometric information private.",
    });
  }),
);
router.post(
  "/attendance/options",
  handle(async (request, response) => {
    if (!["clock_in", "clock_out"].includes(request.body.action))
      return response
        .status(400)
        .json({ message: "Select clock in or clock out." });
    response.json(
      await service.options(request, request.user, request.body.action),
    );
  }),
);
router.post(
  "/attendance/verify",
  handle(async (request, response) => {
    if (!["clock_in", "clock_out"].includes(request.body.action))
      return response
        .status(400)
        .json({ message: "Select clock in or clock out." });
    await service.verify(request, request.body.action, request.user.user_id);
    const token = require("node:crypto").randomBytes(32).toString("hex");
    await query(
      database,
      "DELETE FROM attendance_proofs WHERE expires_at<NOW()",
    );
    await query(
      database,
      "INSERT INTO attendance_proofs(token_hash,user_id,action,expires_at) VALUES (?,?,?,DATE_ADD(NOW(),INTERVAL 2 MINUTE))",
      [service.hash(token), request.user.user_id, request.body.action],
    );
    response.json({ verification_token: token });
  }),
);
module.exports = router;
