const { spawn } = require('child_process');
const path = require('path');

const env = { ...process.env };

if (process.platform === 'win32') {
  let systemRoot = env.SYSTEMROOT || env.WINDIR || 'C:\Windows';
  systemRoot = systemRoot.replace(/\//g, '\\');
  if (/^[A-Za-z]:[^\\]/.test(systemRoot)) {
    systemRoot = `${systemRoot.slice(0, 2)}\\${systemRoot.slice(2)}`;
  }

  const system32 = path.join(systemRoot, 'System32');
  const powershell = path.join(system32, 'WindowsPowerShell', 'v1.0');

  const normalizedPath = (env.PATH || '')
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.toLowerCase());

  const pathAdditions = [];
  if (!normalizedPath.includes(system32.toLowerCase())) pathAdditions.push(system32);
  if (!normalizedPath.includes(systemRoot.toLowerCase())) pathAdditions.push(systemRoot);
  if (!normalizedPath.includes(powershell.toLowerCase())) pathAdditions.push(powershell);

  env.PATH = [...pathAdditions, env.PATH].filter(Boolean).join(';');
  env.COMSPEC = env.COMSPEC || path.join(system32, 'cmd.exe');
}

const concurrentlyPath = path.join(__dirname, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'concurrently.cmd' : 'concurrently');
const args = ['npm run start:backend', 'npm run start:frontend'];

const spawnCommand = process.platform === 'win32' ? (env.COMSPEC || 'cmd.exe') : concurrentlyPath;
const spawnArgs = process.platform === 'win32' ? ['/c', concurrentlyPath, ...args] : args;

const child = spawn(spawnCommand, spawnArgs, {
  env,
  stdio: 'inherit',
  shell: false,
});

child.on('error', (err) => {
  console.error('Failed to launch concurrently:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});
