const { spawn } = require('child_process');
const path = require('path');

/**
 * dev.js - Zero-Guesswork Environment Handler for Windows
 * Instead of relying on the system PATH to find 'node' or 'concurrently',
 * we use absolute paths and the currently running node instance.
 */

const env = { ...process.env };
env.WORKER_URL = 'http://localhost:8000';

// Use the absolute path to the current node executable
const nodePath = process.execPath;
const nodeDir = path.dirname(nodePath);

if (process.platform === 'win32') {
  const systemRoot = env.SystemRoot || env.windir || 'C:\\Windows';
  const system32 = path.join(systemRoot, 'System32');
  const powershell = path.join(system32, 'WindowsPowerShell', 'v1.0');

  // Explicitly inject the folder containing node.exe into the PATH
  const pathAdditions = [nodeDir, system32, systemRoot, powershell];
  env.PATH = [...pathAdditions, (env.PATH || '')].filter(Boolean).join(';');
  
  // Set COMSPEC to cmd.exe in System32 for stability
  env.COMSPEC = path.join(system32, 'cmd.exe');
}

// Find the JS entry point for concurrently to skip the .cmd wrapper hell
const concurrentlyJs = path.join(
  __dirname, 
  '..', 
  'node_modules', 
  'concurrently', 
  'dist', 
  'bin', 
  'concurrently.js'
);

const args = ['npm run start:backend', 'npm run start:frontend'];

console.log('--- Starting IntelliCode (Absolute Path Mode) ---');
console.log(`Node Exec: ${nodePath}`);
console.log('Environment: Windows paths stabilized.');

/**
 * Launch node.exe directly on concurrently.js
 */
const spawnCommand = nodePath;
const spawnArgs = [concurrentlyJs, ...args];

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
