const configuredTarget = process.env.WFI_URL;
if (!configuredTarget) throw new Error('Set WFI_URL to an isolated, seeded browser testing instance.');

const target = new URL(configuredTarget);
if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password ||
    target.pathname !== '/' || target.search || target.hash)
  throw new Error('WFI_URL must be a bare HTTP or HTTPS origin.');

const chromiumOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
module.exports = { base: target.origin, chromiumOptions };
