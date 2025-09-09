#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

// Get command line arguments
const args = process.argv.slice(2);
const environment = args[0] || 'dev';

// Configuration for different environments
const configs = {
  dev: {
    command: 'npm',
    args: ['run', 'dev'],
    env: { NODE_ENV: 'development', PORT: '3000' }
  },
  prod: {
    command: 'npm',
    args: ['run', 'start:prod'],
    env: { NODE_ENV: 'production', PORT: '8080' }
  },
  local: {
    command: 'npm',
    args: ['run', 'start:local'],
    env: { NODE_ENV: 'development', PORT: '3000' }
  }
};

// Get network interfaces to show local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

// Start the server
function startServer(config) {
  console.log(`🚀 Starting DebtManage server in ${environment} mode...`);
  console.log(`📡 Local IP: ${getLocalIP()}`);
  console.log('');
  
  const child = spawn(config.command, config.args, {
    stdio: 'inherit',
    env: { ...process.env, ...config.env },
    shell: true
  });
  
  child.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
  });
  
  child.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

// Validate environment and start
if (configs[environment]) {
  startServer(configs[environment]);
} else {
  console.log('❌ Invalid environment. Available options:');
  console.log('  dev  - Development mode with nodemon');
  console.log('  prod - Production mode');
  console.log('  local - Local development mode');
  console.log('');
  console.log('Usage: node start.js [environment]');
  console.log('Example: node start.js dev');
}