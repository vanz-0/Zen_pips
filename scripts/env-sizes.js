const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
    console.error('.env file not found at', envPath);
    process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));

let total = 0;
console.log('--- Environment Variable Sizes ---');
for (const [key, value] of Object.entries(envConfig)) {
    const size = Buffer.byteLength(value, 'utf8');
    console.log(`${key}: ${size} bytes`);
    total += size;
}

console.log('---------------------------------');
console.log('TOTAL SIZE (Values only):', total, 'bytes');
console.log('TOTAL SIZE (Keys + Values approx):', total + Object.keys(envConfig).join('').length + Object.keys(envConfig).length, 'bytes');
console.log('LIMIT: 4096 bytes');
