import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { once } from 'node:events';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const handler = require(path.join(projectRoot, 'api', 'ai.js'));
const localServerPath = path.join(projectRoot, 'scripts', 'local-api-server.mjs');
const issue = {
  title: 'Instructional technology access',
  category: 'Education',
  summary: 'Whether students can use classroom tools with assistive technology.',
  governmentLevels: ['School or district', 'State'],
  policyQuestions: ['Which tools have accessibility barriers?'],
  sources: [{ name: 'Missouri DESE', url: 'https://dese.mo.gov/' }],
};

function providerResponse(content, { ok = true, status = 200, json = null } = {}) {
  return {
    ok,
    status,
    json: async () => typeof json === 'function' ? json() : json ?? { choices: [{ message: { content } }] },
  };
}

async function invokeHandler({ body, method = 'POST', key = 'unit-test-placeholder', fetchImpl } = {}) {
  const oldKey = process.env.OPENROUTER_API_KEY;
  const oldFetch = globalThis.fetch;
  if (key === null) {
    delete process.env.OPENROUTER_API_KEY;
  } else {
    process.env.OPENROUTER_API_KEY = key;
  }
  globalThis.fetch = fetchImpl ?? (async () => providerResponse('Mock provider response'));

  const response = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };

  try {
    await handler({ method, body }, response);
    return response;
  } finally {
    if (oldKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = oldKey;
    globalThis.fetch = oldFetch;
  }
}

async function reservePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForHealth(url, child) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Local API exited during startup (${child.exitCode}).`);
    }
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error('Local API did not become ready within 10 seconds.');
}

test('handler rejects unsupported methods and invalid payloads', async () => {
  const method = await invokeHandler({ method: 'GET', body: {} });
  assert.equal(method.statusCode, 405);
  assert.equal(method.headers.Allow, 'POST');

  const missingIssue = await invokeHandler({ body: { kind: 'explain_issue' } });
  assert.equal(missingIssue.statusCode, 400);
  assert.match(missingIssue.body.error, /issue context/i);

  const unsupported = await invokeHandler({ body: { kind: 'unrecognized' } });
  assert.equal(unsupported.statusCode, 400);
});

test('issue explanation forwards issue context and returns structured sections', async () => {
  let forwarded;
  const content = JSON.stringify({
    sections: [{ title: 'The issue', content: 'Accessibility of classroom tools.' }],
    caution: 'Verify current district practice.',
  });
  const response = await invokeHandler({
    body: { kind: 'explain_issue', issue, question: 'Who is affected?' },
    fetchImpl: async (url, options) => {
      forwarded = { url, payload: JSON.parse(options.body) };
      return providerResponse(content);
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.cached, false);
  assert.equal(response.body.sections[0].title, 'The issue');
  assert.equal(forwarded.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.match(forwarded.payload.messages[1].content, /Instructional technology access/);
  assert.match(forwarded.payload.messages[1].content, /Who is affected/);
  assert.equal(forwarded.payload.model, process.env.OPENROUTER_MODEL || 'recursive/flint-v1.0:free');
});

test('advocacy generation forwards issue, perspective, recipient, and tone', async () => {
  let forwarded;
  const response = await invokeHandler({
    body: {
      kind: 'generate_advocacy_draft',
      articleId: 'instructional-technology-access',
      issueTitle: issue.title,
      issueSummary: issue.summary,
      personalPerspective: 'Students need tools that work with assistive technology.',
      requestedAction: 'Review the district tools.',
      tone: 'persuasive',
      officialName: 'Representative Example',
      officialOffice: 'State Representative',
      officialJurisdiction: 'District 1',
    },
    fetchImpl: async (_url, options) => {
      forwarded = JSON.parse(options.body);
      return providerResponse('Please review accessibility of current tools.');
    },
  });

  const prompt = forwarded.messages[1].content;
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.cached, false);
  assert.match(response.body.body, /Representative Example/);
  assert.match(response.body.body, /Please review accessibility/);
  assert.match(prompt, /Tone: persuasive/);
  assert.match(prompt, /Students need tools/);
  assert.match(prompt, /Review the district tools/);
  assert.match(prompt, /District 1/);
});

test('missing server configuration returns 503 without calling provider', async () => {
  let called = false;
  const response = await invokeHandler({
    key: null,
    body: { kind: 'explain_issue', issue },
    fetchImpl: async () => { called = true; return providerResponse('unexpected'); },
  });
  assert.equal(response.statusCode, 503);
  assert.match(response.body.error, /OPENROUTER_API_KEY/);
  assert.equal(called, false);
});

test('malformed and empty provider output are rejected', async () => {
  const malformed = await invokeHandler({
    body: { kind: 'explain_issue', issue },
    fetchImpl: async () => providerResponse('not-json'),
  });
  assert.equal(malformed.statusCode, 502);
  assert.match(malformed.body.error, /formatted/i);

  const empty = await invokeHandler({
    body: { kind: 'generate_advocacy_draft', articleId: 'issue-1', issueTitle: 'Access' },
    fetchImpl: async () => providerResponse(''),
  });
  assert.equal(empty.statusCode, 502);
  assert.match(empty.body.error, /empty response/i);
});

test('provider authentication, rate-limit, generic errors, and timeout are safe', async () => {
  for (const [status, expected] of [[401, 502], [403, 502], [429, 429], [500, 502]]) {
    const response = await invokeHandler({
      body: { kind: 'ask_companion', question: 'How does a bill become law?' },
      fetchImpl: async () => providerResponse('', { ok: false, status, json: async () => ({ error: { message: 'PRIVATE UPSTREAM DETAIL' } }) }),
    });
    assert.equal(response.statusCode, expected);
    assert.doesNotMatch(JSON.stringify(response.body), /PRIVATE UPSTREAM DETAIL/);
  }

  const timeout = await invokeHandler({
    body: { kind: 'ask_companion', question: 'How does a bill become law?' },
    fetchImpl: async () => { throw Object.assign(new Error('private timeout detail'), { name: 'TimeoutError' }); },
  });
  assert.equal(timeout.statusCode, 504);
  assert.doesNotMatch(JSON.stringify(timeout.body), /private timeout detail/);

  const unexpected = await invokeHandler({
    body: { kind: 'ask_companion', question: 'How does a bill become law?' },
    fetchImpl: async () => { throw new Error('PRIVATE INTERNAL DETAIL'); },
  });
  assert.equal(unexpected.statusCode, 502);
  assert.doesNotMatch(JSON.stringify(unexpected.body), /PRIVATE INTERNAL DETAIL/);
});

test('local HTTP server health, JSON validation, missing-key response, and continued availability', async (t) => {
  const port = await reservePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [localServerPath], {
    cwd: projectRoot,
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), OPENROUTER_API_KEY: '' },
    stdio: 'ignore',
  });
  t.after(async () => {
    if (child.exitCode === null) {
      child.kill();
      await once(child, 'exit').catch(() => undefined);
    }
  });

  await waitForHealth(baseUrl, child);
  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).service, 'VOICE Pulse local API');

  const malformed = await fetch(`${baseUrl}/api/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{invalid-json',
  });
  assert.equal(malformed.status, 400);
  assert.match((await malformed.json()).error, /valid JSON/i);

  const validShape = await fetch(`${baseUrl}/api/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'explain_issue', issue }),
  });
  assert.equal(validShape.status, 503);
  assert.match((await validShape.json()).error, /OPENROUTER_API_KEY/);

  const healthAfterErrors = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthAfterErrors.status, 200);
  assert.equal(child.exitCode, null);
});
