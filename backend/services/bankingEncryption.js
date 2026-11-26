const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { query } = require("./database");
const prefix = "bank-encrypted:";
/** Keep the encryption key in the persistent private state volume, outside Git. */
function key() {
  const directory =
    process.env.CHAT_KEY_DIR || path.join(__dirname, "../state");
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const file = path.join(directory, "banking-key");
  try {
    return fs.readFileSync(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const value = crypto.randomBytes(32);
    try {
      fs.writeFileSync(file, value, { mode: 0o600, flag: "wx" });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    return fs.readFileSync(file);
  }
}
function encrypt(value) {
  if (typeof value !== "string" || !value || value.length > 100)
    throw Object.assign(new Error("Enter a valid account number."), {
      status: 400,
    });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from("employee-banking"));
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return (
    prefix +
    Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64")
  );
}
function mask(row) {
  return row.account_last_four
    ? "•••• " + row.account_last_four
    : row.account_number
      ? "••••"
      : "Not provided";
}
async function ensure(connection) {
  const [column] = await query(
    connection,
    "SELECT COLUMN_NAME FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='employee_banking' AND COLUMN_NAME='account_last_four'",
  );
  if (!column)
    await query(
      connection,
      "ALTER TABLE employee_banking ADD COLUMN account_last_four CHAR(4) NULL",
    );
  const [legacy] = await query(
    connection,
    "SELECT DATA_TYPE FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='account_number'",
  );
  if (legacy && legacy.DATA_TYPE !== "text")
    await query(
      connection,
      "ALTER TABLE users MODIFY account_number TEXT NULL",
    );
}
async function migrate(connection) {
  const legacy = await query(
    connection,
    "SELECT user_id,account_number FROM users WHERE account_number IS NOT NULL",
  );
  for (const user of legacy) {
    if (!user.account_number.startsWith(prefix))
      await query(
        connection,
        "UPDATE users SET account_number=? WHERE user_id=?",
        [encrypt(user.account_number), user.user_id],
      );
  }
  const rows = await query(
    connection,
    "SELECT user_id,account_number FROM employee_banking",
  );
  for (const row of rows) {
    if (!row.account_number || row.account_number.startsWith(prefix)) continue;
    await query(
      connection,
      "UPDATE employee_banking SET account_number=?,account_last_four=? WHERE user_id=?",
      [
        encrypt(String(row.account_number)),
        String(row.account_number).slice(-4),
        row.user_id,
      ],
    );
  }
}
module.exports = { encrypt, mask, ensure, migrate };
