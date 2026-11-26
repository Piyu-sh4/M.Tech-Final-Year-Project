const { randomUUID } = require('node:crypto');
const { mkdir, readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');

const uploadRoot = path.resolve(__dirname, '../uploads');

function imageExtension(bytes) {
  if (bytes.length < 12) return null;
  if (bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) &&
      bytes.toString('ascii', 12, 16) === 'IHDR') return 'png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

function documentExtension(bytes) {
  return bytes.toString('ascii', 0, 5) === '%PDF-' ? 'pdf' : imageExtension(bytes);
}

async function storeUpload(folder, bytes, extension) {
  const directory = path.join(uploadRoot, folder);
  const filename = randomUUID() + '.' + extension;
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), bytes, { flag: 'wx', mode: 0o600 });
  return { filename, path: path.join(directory, filename), url: '/uploads/' + folder + '/' + filename };
}

function storedPath(url, folder) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/' + folder + '/')) return null;
  const name = url.slice(('/uploads/' + folder + '/').length);
  return /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(name) ? path.join(uploadRoot, folder, name) : null;
}

module.exports = { imageExtension, documentExtension, storeUpload, storedPath, readFile };
