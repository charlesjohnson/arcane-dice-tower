#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const contextFile = resolve(projectRoot, '.context', 'dev-server.json');

async function main() {
  const vite = spawn('npx', ['vite'], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let started = false;
  let output = '';

  vite.stdout.on('data', (data) => {
    output += data.toString();
    if (!started && output.includes('Local:')) {
      started = true;
      const match = output.match(/Local:\s+(https?:\/\/[^\s]+)/);
      if (match) {
        const url = match[1];
        const result = { url, pid: vite.pid };
        mkdirSync(dirname(contextFile), { recursive: true });
        writeFileSync(contextFile, JSON.stringify(result, null, 2) + '\n');
        console.log(JSON.stringify(result));
      }
    }
  });

  vite.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  vite.on('exit', (code) => {
    process.exit(code ?? 1);
  });

  process.on('SIGINT', () => vite.kill('SIGINT'));
  process.on('SIGTERM', () => vite.kill('SIGTERM'));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
