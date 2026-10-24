import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const aiHandler = require(path.join(projectRoot, 'api', 'ai.js'));
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:8081';
const maxBodyBytes = 16 * 1024;

function sendJson(response, status, payload) {
  if (response.writableEnded) {
    return;
  }
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      const error = new Error('Request body exceeds 16 KB.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (size === 0) {
    return {};
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Request body must contain valid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin === allowedOrigin) {
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const pathname = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`).pathname;
  if (pathname === '/api/health') {
    if (request.method !== 'GET') {
      sendJson(response, 405, { error: 'Method not allowed.' });
      return;
    }
    sendJson(response, 200, { ok: true, service: 'VOICE Pulse local API' });
    return;
  }

  if (pathname !== '/api/ai') {
    sendJson(response, 404, { error: 'Route not found.' });
    return;
  }
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }
  if (!request.headers['content-type']?.includes('application/json')) {
    sendJson(response, 415, { error: 'Content-Type must be application/json.' });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const responseAdapter = {
      statusCode: 200,
      setHeader(name, value) {
        response.setHeader(name, value);
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        sendJson(response, this.statusCode, payload);
        return response;
      },
    };

    await aiHandler({ method: request.method, headers: request.headers, body }, responseAdapter);
    if (!response.writableEnded) {
      sendJson(response, 500, { error: 'The AI handler did not return a response.' });
    }
  } catch (error) {
    const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    if (status >= 500) {
      console.error(`Local AI request failed with status ${status}.`);
    }
    sendJson(response, status, { error: status < 500 ? error.message : 'The local AI server could not process the request.' });
  }
});

server.on('clientError', (_error, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
});

server.listen(port, host, () => {
  console.log(`VOICE Pulse local API listening at http://${host}:${port}`);
  console.log(`OpenRouter server key configured: ${Boolean(process.env.OPENROUTER_API_KEY)}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
