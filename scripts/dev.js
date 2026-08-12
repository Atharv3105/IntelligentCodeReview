const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * dev.js - Robust Multi-Service Launcher for Windows
 */

const env = { ...process.env };
const nodePath = process.execPath;
const nodeDir = path.dirname(nodePath);

if (process.platform === 'win32') {
  const systemRoot = env.SystemRoot || env.windir || 'C:\\Windows';
  const system32 = path.join(systemRoot, 'System32');
  const powershell = path.join(system32, 'WindowsPowerShell', 'v1.0');

  const pathAdditions = [nodeDir, system32, systemRoot, powershell];
  env.PATH = [...pathAdditions, (env.PATH || '')].filter(Boolean).join(';');
  env.COMSPEC = path.join(system32, 'cmd.exe');
}

// Check for concurrently JS file location dynamically
function findConcurrently() {
  const rootNodeModules = path.join(__dirname, '..', 'node_modules', 'concurrently');
  const possiblePaths = [
    path.join(rootNodeModules, 'dist', 'bin', 'concurrently.js'),
    path.join(rootNodeModules, 'bin', 'concurrently.js'),
    path.join(rootNodeModules, 'index.js')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }

  try {
    return require.resolve('concurrently/bin/concurrently.js');
  } catch (e) {
    return null;
  }
}

let concurrentlyPath = findConcurrently();

if (!concurrentlyPath) {
  console.log('Installing workspace dependencies (concurrently)...');
  try {
    execSync('npm install --no-audit --no-fund', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    concurrentlyPath = findConcurrently();
  } catch (err) {
    console.error('Failed to auto-install root dependencies:', err);
  }
}

const commands = ['npm run start:backend', 'npm run start:frontend'];

console.log('--- Starting Platform Services ---');
console.log(`Node Exec: ${nodePath}`);

let child;
if (concurrentlyPath) {
  child = spawn(nodePath, [concurrentlyPath, ...commands], { env, stdio: 'inherit', shell: false });
} else {
  // Fallback to npx or shell command
  const npmCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  child = spawn(npmCmd, ['concurrently', ...commands], { env, stdio: 'inherit', shell: true });
}

child.on('error', (err) => {
  console.error('Failed to launch development servers:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
