const { spawn } = require('child_process');
const path = require('path');

// Load environment variables from .env file (if running locally)
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const migrateCommand = 'node-pg-migrate';
const migrateArgs = ['-m', 'migrations', 'up'];

console.log(`Running migrations with: ${migrateCommand} ${migrateArgs.join(' ')}`);
console.log(`Using DATABASE_URL: ${DATABASE_URL}`); // Log the DATABASE_URL

const child = spawn(migrateCommand, migrateArgs, {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: DATABASE_URL, NODE_TLS_REJECT_UNAUTHORIZED: '0' }
});

child.on('error', (error) => {
  console.error(`Failed to start migration process: ${error}`);
  process.exit(1);
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`Migrations exited with code ${code}`);
    process.exit(code);
  }
  console.log('Migrations completed successfully.');
});
