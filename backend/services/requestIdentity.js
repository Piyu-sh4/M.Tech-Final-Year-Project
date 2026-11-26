const { isIP } = require("node:net");
/** Read forwarded client IP only when the direct peer is explicitly configured as a trusted proxy.
 * Compose must keep the published application port bound to 127.0.0.1.
 * An IP is an audit signal, not proof of a person's physical location.
 */
function clientIp(request) {
  const peer = String(request.socket?.remoteAddress || "").replace(
    /^::ffff:/,
    "",
  );
  const trustedProxies = (process.env.TRUSTED_PROXY_IPS || '').split(',')
    .map(address => address.trim().replace(/^::ffff:/, ''))
    .filter(address => isIP(address));
  const forwarded = request.headers["cf-connecting-ip"];
  return trustedProxies.includes(peer) &&
    request.headers["cf-ray"] &&
    typeof forwarded === "string" &&
    isIP(forwarded)
    ? forwarded
    : isIP(peer)
      ? peer
      : null;
}
module.exports = { clientIp };
