const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const db = require('../config/db');

const providers = Object.freeze({
  openai: { label: 'OpenAI', env: 'OPENAI_API_KEY', model: 'gpt-4.1-mini', url: 'https://api.openai.com/v1/chat/completions', limit: 'max_completion_tokens' },
  anthropic: { label: 'Anthropic', env: 'ANTHROPIC_API_KEY', model: 'claude-haiku-4-5-20251001', url: 'https://api.anthropic.com/v1/messages', limit: 'max_tokens' },
  nvidia: { label: 'NVIDIA NIM', env: 'NVIDIA_API_KEY', model: 'meta/llama-3.1-8b-instruct', url: 'https://integrate.api.nvidia.com/v1/chat/completions', limit: 'max_tokens' },
  gemini: { label: 'Google Gemini / AI Studio', env: 'GEMINI_API_KEY', model: 'gemini-3.5-flash-lite', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', limit: 'max_tokens' },
  openrouter: { label: 'OpenRouter', env: 'OPENROUTER_API_KEY', model: 'openrouter/auto', url: 'https://openrouter.ai/api/v1/chat/completions', limit: 'max_tokens' },
});

const query = (sql, params = []) => new Promise((resolve, reject) =>
  db.query(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));

const validProvider = name => typeof name === 'string' && Object.hasOwn(providers, name);
const validModel = model => typeof model === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:/+-]{0,199}$/.test(model);
const validKey = key => typeof key === 'string' && /^[!-~]{8,2048}$/.test(key);
const failure = (message, status) => Object.assign(new Error(message), { status });

async function ensureSchema() {
  await query(`CREATE TABLE IF NOT EXISTS chat_providers (
    provider VARCHAR(24) PRIMARY KEY,
    model VARCHAR(200) NOT NULL,
    encrypted_key TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await query(`CREATE TABLE IF NOT EXISTS chat_provider_selection (
    id TINYINT PRIMARY KEY,
    provider VARCHAR(24) NOT NULL
  )`);
}

function encryptionKey() {
  const directory = process.env.CHAT_KEY_DIR || path.join(__dirname, '../state');
  const filename = path.join(directory, 'chat-key');
  try {
    const key = fs.readFileSync(filename);
    if (key.length !== 32) throw new Error('Invalid chat encryption key');
    return key;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const temp = path.join(directory, '.chat-key-' + crypto.randomUUID());
  fs.writeFileSync(temp, crypto.randomBytes(32), { mode: 0o600, flag: 'wx' });
  try { fs.linkSync(temp, filename); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  finally { fs.unlinkSync(temp); }
  return encryptionKey();
}

function encrypt(provider, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  cipher.setAAD(Buffer.from(provider));
  const ciphertext = Buffer.concat([cipher.update(key, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}

function decrypt(provider, stored) {
  const value = Buffer.from(stored, 'base64');
  const cipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), value.subarray(0, 12));
  cipher.setAAD(Buffer.from(provider));
  cipher.setAuthTag(value.subarray(12, 28));
  return Buffer.concat([cipher.update(value.subarray(28)), cipher.final()]).toString('utf8');
}

function fromEnvironment() {
  const provider = String(process.env.AI_PROVIDER || 'openrouter').toLowerCase();
  if (!validProvider(provider)) return null;
  const apiKey = process.env[providers[provider].env];
  if (!validKey(apiKey) || /your[-_ ](?:key|api[-_ ]key)/i.test(apiKey)) return null;
  return { provider, model: process.env.AI_MODEL || providers[provider].model, apiKey };
}

async function describe() {
  const [saved, selections] = await Promise.all([
    query('SELECT provider, model FROM chat_providers'),
    query('SELECT provider FROM chat_provider_selection WHERE id=1'),
  ]);
  const selected = selections[0]?.provider;
  const env = !selected ? fromEnvironment() : null;
  return {
    active: selected && selected !== 'disabled' ? selected : env?.provider ?? null,
    activeModel: env?.model || saved.find(item => item.provider === selected)?.model || null,
    source: selected === 'disabled' ? 'disabled' : selected ? 'settings' : env ? 'environment' : 'unconfigured',
    providers: Object.entries(providers).map(([id, spec]) => {
      const row = saved.find(item => item.provider === id);
      return { id, label: spec.label, model: row?.model || (env?.provider === id && env.model) || spec.model, hasKey: !!row };
    }),
  };
}

async function save(provider, { model, apiKey }) {
  if (!validProvider(provider) || !validModel(model)) throw failure('Choose a supported provider and enter a valid model ID.', 400);
  if (apiKey !== undefined) {
    if (!validKey(apiKey)) throw failure('Enter a valid provider API key.', 400);
    await query(`INSERT INTO chat_providers (provider, model, encrypted_key) VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE model=VALUES(model), encrypted_key=VALUES(encrypted_key)`, [provider, model, encrypt(provider, apiKey)]);
  } else {
    const result = await query('UPDATE chat_providers SET model=? WHERE provider=?', [model, provider]);
    if (!result.affectedRows) throw failure('Enter an API key to configure this provider.', 400);
  }
}

async function select(provider) {
  if (provider === 'disabled') {
    await query("INSERT INTO chat_provider_selection (id,provider) VALUES (1,'disabled') ON DUPLICATE KEY UPDATE provider='disabled'");
    return;
  }
  if (!validProvider(provider)) throw failure('Choose a supported provider.', 400);
  const result = await query(`INSERT INTO chat_provider_selection (id, provider)
    SELECT 1, provider FROM chat_providers WHERE provider=?
    ON DUPLICATE KEY UPDATE provider=VALUES(provider)`, [provider]);
  if (!result.affectedRows) throw failure('Save a key and model before activating this provider.', 409);
}

async function getActive(withKey = false) {
  const [row] = await query(`SELECT s.provider, p.model, p.encrypted_key FROM chat_provider_selection s
    LEFT JOIN chat_providers p ON p.provider=s.provider WHERE s.id=1`);
  if (!row) {
    const env = fromEnvironment();
    if (!env) return null;
    return withKey ? env : { provider: env.provider, model: env.model };
  }
  if (!validProvider(row.provider) || !row.model) return null;
  const result = { provider: row.provider, model: row.model };
  if (withKey) result.apiKey = decrypt(row.provider, row.encrypted_key);
  return result;
}

async function requestCompletion(config, messages, system, maxTokens) {
  if (!config) throw failure('Chat is disabled or has no provider. Ask an administrator to configure AI Chat Settings.', 503);
  const { provider, model, apiKey } = config;
  const spec = providers[provider];
  const headers = { 'Content-Type': 'application/json' };
  const payload = { model, [spec.limit]: maxTokens, messages };
  if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
    if (system) payload.system = system;
  } else {
    headers.Authorization = 'Bearer ' + apiKey;
    if (system) payload.messages = [{ role: 'system', content: system }, ...messages];
  }
  let response;
  try {
    response = await fetch(spec.url, { method: 'POST', headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(30_000), redirect: 'error' });
  } catch {
    throw failure(spec.label + ' could not be reached. Try again shortly.', 502);
  }
  if (!response.ok) {
    // Provider errors can echo input or credential fragments. Return a local message only.
    await response.body?.cancel().catch(() => {});
    if (response.status === 401 || response.status === 403) throw failure(spec.label + ' rejected the credential or model access. Check AI Chat Settings.', 502);
    if (response.status === 404) throw failure(spec.label + ' could not find or serve the configured model. Select an available model in AI Chat Settings.', 502);
    if (response.status === 503) throw failure(spec.label + ' is temporarily unavailable. Try again shortly.', 503);
    if (response.status === 429) throw failure(spec.label + ' rate limit or quota reached. Try again shortly.', 429);
    throw failure(spec.label + ' could not complete the request. Check the model ID and provider availability.', 502);
  }
  const data = await response.json().catch(() => null);
  const text = provider === 'anthropic'
    ? (Array.isArray(data?.content) ? data.content.filter(part => part?.type === 'text' && typeof part.text === 'string').map(part => part.text).join('\n') : '')
    : data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw failure(spec.label + ' returned no text.', 502);
  return { provider, model: data.model || model, content: [{ type: 'text', text }] };
}

module.exports = { ensureSchema, describe, save, select, getActive, requestCompletion, fromEnvironment };
