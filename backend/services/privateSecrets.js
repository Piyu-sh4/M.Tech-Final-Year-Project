const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
/** Create a secret atomically in the persistent private state volume. Never log it. */
function readOrCreate(name) {
  if (!/^[a-z-]+$/.test(name)) throw Error("Invalid private secret name");
  const directory =
    process.env.CHAT_KEY_DIR || path.join(__dirname, "../state");
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const filename = path.join(directory, name);
  try {
    const value = fs.readFileSync(filename);
    if (value.length !== 32)
      throw Error("Private secret has an invalid length");
    return value;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const temporary = path.join(
    directory,
    "." + name + "-" + crypto.randomUUID(),
  );
  fs.writeFileSync(temporary, crypto.randomBytes(32), {
    mode: 0o600,
    flag: "wx",
  });
  try {
    fs.linkSync(temporary, filename);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  } finally {
    fs.unlinkSync(temporary);
  }
  return fs.readFileSync(filename);
}
module.exports = { readOrCreate };
