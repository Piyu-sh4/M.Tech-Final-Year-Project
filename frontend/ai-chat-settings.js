'use strict';

const get = id => document.getElementById(id);
const token = localStorage.getItem('token');
const form = get('provider-form');
const fields = ['provider', 'model', 'api-key', 'activate', 'disable'].map(get);
let settings;

function show(text, error = false) {
  get('message').textContent = text;
  get('message').dataset.error = error;
}

async function request(route, body) {
  const response = await fetch('/api/chat/' + route, {
    method: body === undefined ? 'GET' : 'PUT',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Could not update AI Chat Settings.');
  return result;
}

function selected() {
  return settings.providers.find(provider => provider.id === get('provider').value);
}

function renderProvider() {
  const provider = selected();
  get('model').value = provider.model;
  get('api-key').value = '';
  get('api-key').required = !provider.hasKey;
  get('key-status').textContent = provider.hasKey
    ? 'Key saved. Leave blank to keep it.'
    : 'Enter the API key for this provider.';
  get('activate').disabled = !provider.hasKey || (settings.active === provider.id && settings.source === 'settings');
  get('disable').disabled = !settings.active;
}

function render() {
  const select = get('provider');
  const previous = select.value;
  select.replaceChildren(...settings.providers.map(provider => new Option(provider.label, provider.id)));
  select.value = previous || settings.active || settings.providers[0].id;
  const active = settings.providers.find(provider => provider.id === settings.active);
  get('active').textContent = active ? 'Active: ' + active.label + ' · ' + settings.activeModel
    + (settings.source === 'environment' ? ' (server configuration)' : '')
    : settings.source === 'disabled' ? 'Chat is disabled.' : 'Chat has no active provider.';
  renderProvider();
  get('provider-section').hidden = false;
}

async function change(route, body, success) {
  for (const element of fields) element.disabled = true;
  form.querySelector('button[type=submit]').disabled = true;
  try {
    settings = await request(route, body);
    show(success);
  } catch (error) {
    show(error.message, true);
  } finally {
    form.querySelector('button[type=submit]').disabled = false;
    for (const element of fields) element.disabled = false;
    render();
  }
}

get('provider').addEventListener('change', renderProvider);
form.addEventListener('submit', event => {
  event.preventDefault();
  const key = get('api-key').value.trim();
  const body = { model: get('model').value.trim() };
  if (key) body.apiKey = key;
  change('providers/' + selected().id, body, 'Configuration saved.');
});
get('activate').addEventListener('click', () => change('active-provider', { provider: selected().id }, 'Active chat provider updated.'));
get('disable').addEventListener('click', () => change('active-provider', { provider: 'disabled' }, 'Chat disabled.'));
if (!token) location.replace('/login.html');
else request('providers').then(result => { settings = result; render(); }).catch(error => show(error.message, true));
