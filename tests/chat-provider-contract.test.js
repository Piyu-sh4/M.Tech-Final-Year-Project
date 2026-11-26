jest.mock('../backend/config/db', () => ({}));
const { requestCompletion } = require('../backend/services/chatProviders');

afterEach(() => jest.restoreAllMocks());

test.each([
  ['openai', 'api.openai.com', 'max_completion_tokens'],
  ['anthropic', 'api.anthropic.com', 'max_tokens'],
  ['gemini', 'generativelanguage.googleapis.com', 'max_tokens'],
  ['nvidia', 'integrate.api.nvidia.com', 'max_tokens'],
  ['openrouter', 'openrouter.ai', 'max_tokens'],
])('%s sends the expected request and normalizes the response', async (provider, hostname, limit) => {
  const anthropic = provider === 'anthropic';
  const simulatedResponse = anthropic
    ? { content: [null, { type: 'text', text: 'Sample answer' }] }
    : { choices: [{ message: { content: 'Sample answer' } }] };
  const fetchProvider = jest.spyOn(global, 'fetch').mockResolvedValue(Response.json(simulatedResponse));
  const messages = [{ role: 'user', content: 'Synthetic question' }];

  const answer = await requestCompletion({ provider, model: 'fixture', apiKey: 'fixture-key' }, messages, 'System text', 42);
  const [[url, options]] = fetchProvider.mock.calls;
  const payload = JSON.parse(options.body);

  expect(new URL(url).hostname).toBe(hostname);
  expect(options.redirect).toBe('error');
  expect(payload[limit]).toBe(42);
  if (anthropic) {
    expect(options.headers['x-api-key']).toBe('fixture-key');
    expect(payload.system).toBe('System text');
    expect(payload.messages).toEqual(messages);
  } else {
    expect(options.headers.Authorization).toBe('Bearer fixture-key');
    expect(payload.messages).toEqual([{ role: 'system', content: 'System text' }, ...messages]);
  }
  expect(answer).toMatchObject({ provider, model: 'fixture', content: [{ text: 'Sample answer' }] });
});

test.each([[401, 502], [404, 502], [429, 429], [500, 502], [503, 503]])(
  'provider response %s returns a local message and status %s', async (upstreamStatus, status) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('private upstream details', { status: upstreamStatus }));
    const result = requestCompletion({ provider: 'openai', model: 'fixture', apiKey: 'fixture-key' }, [], '', 5);
    await expect(result).rejects.toMatchObject({ status });
    await expect(result).rejects.not.toThrow('private upstream details');
  }
);

test('invalid JSON provider responses fail with a readable message', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue(new Response('invalid JSON'));
  await expect(requestCompletion({ provider: 'anthropic', model: 'fixture', apiKey: 'fixture-key' }, [], '', 5))
    .rejects.toMatchObject({ status: 502, message: 'Anthropic returned no text.' });
});
