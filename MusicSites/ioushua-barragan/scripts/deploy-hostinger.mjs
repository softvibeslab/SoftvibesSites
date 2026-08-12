import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { buildSite } from './build-site.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Uso: HOSTINGER_API_TOKEN=xxx npm run deploy:hostinger -- [dominio]');
  console.log('Dominio default: plum-hyena-228473.hostingersite.com');
  process.exit(0);
}

const DOMAIN = args[0] || process.env.HOSTINGER_DOMAIN || 'plum-hyena-228473.hostingersite.com';
const TOKEN = process.env.HOSTINGER_API_TOKEN;
const ACCOUNT_ID = process.env.HOSTINGER_ACCOUNT_ID || 'u641670749';
const ARCHIVE = path.join(os.tmpdir(), `ieoushua-${Date.now()}.zip`);

if (!TOKEN) {
  throw new Error('Falta HOSTINGER_API_TOKEN en el entorno.');
}

function createArchive() {
  buildSite();
  const dist = path.join(ROOT, 'dist');
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    throw new Error('dist/index.html no existe.');
  }
  try {
    fs.rmSync(ARCHIVE, { force: true });
    execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '.', ARCHIVE], {
      cwd: dist,
      stdio: 'inherit'
    });
  } catch {
    fs.rmSync(ARCHIVE, { force: true });
    execFileSync('zip', ['-rq', ARCHIVE, '.'], {
      cwd: dist,
      stdio: 'inherit'
    });
  }
  return ARCHIVE;
}

function send(proc, message) {
  proc.stdin.write(`${JSON.stringify(message)}\n`);
}

function readJsonLines(proc) {
  const lines = [];
  proc.stdout.on('data', (chunk) => {
    for (const line of String(chunk).split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('{')) lines.push(trimmed);
    }
  });
  return lines;
}

function waitFor(lines, id, timeoutMs = 600000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      while (lines.length) {
        const line = lines.shift();
        try {
          const message = JSON.parse(line);
          if (message.id === id) {
            clearInterval(timer);
            resolve(message);
            return;
          }
        } catch {
          // Ignore non-RPC lines.
        }
      }
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error(`Sin respuesta del MCP para id=${id}`));
      }
    }, 250);
  });
}

async function deployStaticWebsite(archivePath) {
  const proc = spawn('npx', ['--package=hostinger-api-mcp@latest', 'hostinger-hosting-mcp'], {
    env: { ...process.env, HOSTINGER_API_TOKEN: TOKEN },
    stdio: ['pipe', 'pipe', 'ignore']
  });
  const lines = readJsonLines(proc);

  send(proc, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'ieoushua-deploy', version: '1.0.0' }
    }
  });
  const init = await waitFor(lines, 1, 60000);
  if (init.error) throw new Error(JSON.stringify(init.error));

  send(proc, { jsonrpc: '2.0', method: 'notifications/initialized' });
  send(proc, {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'hosting_deployStaticWebsite',
      arguments: { domain: DOMAIN, archivePath, removeArchive: false }
    }
  });

  const response = await waitFor(lines, 2);
  proc.kill();
  if (response.error) throw new Error(JSON.stringify(response.error));
  const text = response.result?.content?.find((item) => item.type === 'text')?.text || '';
  if (response.result?.isError) throw new Error(text || 'Hostinger reportó error de deploy.');
  return text;
}

async function clearCache() {
  const endpoint = `https://developers.hostinger.com/api/hosting/v1/accounts/${ACCOUNT_ID}/websites/${DOMAIN}/cache/clear`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: '{}'
  }).catch(() => null);
  return response?.ok || false;
}

const archivePath = createArchive();
console.log(`Deploying ${archivePath} -> https://${DOMAIN}`);
const result = await deployStaticWebsite(archivePath);
console.log(result || 'Deploy complete.');
console.log(`Cache cleared: ${await clearCache() ? 'yes' : 'no'}`);
console.log(`Live URL: https://${DOMAIN}`);
