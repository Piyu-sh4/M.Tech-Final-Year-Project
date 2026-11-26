const { randomUUID } = require('node:crypto');

const documents = new Map();
const lifetimeMs = 30 * 60 * 1000;
const maxDocuments = 100;

// Temporary retrieval index. Every document belongs to the authenticated uploader.
function indexFileContent(userId, filename, content) {
  const now = Date.now();
  for (const [id, document] of documents) {
    if (document.expiresAt <= now) documents.delete(id);
  }
  const text = String(content || '').slice(0, 100000);
  const chunks = [];
  for (let position = 0; position < text.length; position += 700)
    chunks.push(text.slice(position, position + 850));
  const id = randomUUID();
  documents.set(id, {userId, filename, chunks, expiresAt:now + lifetimeMs});
  while (documents.size > maxDocuments) documents.delete(documents.keys().next().value);
  return {id, count:chunks.length};
}

function retrieveRelevantChunks(userId, id, question) {
  const document = documents.get(id);
  if (!document || document.userId !== userId || document.expiresAt <= Date.now()) return null;
  const terms = new Set(question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []);
  const ranked = document.chunks.map(text => {
    const lower = text.toLowerCase();
    return {text, score:[...terms].filter(term => lower.includes(term)).length};
  }).sort((left,right) => right.score-left.score);
  const matches = ranked.filter(chunk => chunk.score > 0);
  return {source:document.filename, excerpts:(matches.length ? matches : ranked).slice(0,5).map(chunk=>chunk.text)};
}

module.exports = { indexFileContent, retrieveRelevantChunks };
