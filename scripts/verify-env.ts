import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log('--- Environment Verification ---');
const googleKey = process.env.GOOGLE_API_KEY;
console.log(`Google Key Present: ${googleKey ? 'YES' : 'NO'}`);

const googleModel = process.env.AI_MODEL_GOOGLE;
console.log(`Selected Google Model: ${googleModel || '(default)'}`);

const openaiModel = process.env.AI_MODEL_OPENAI;
console.log(`Selected OpenAI Model: ${openaiModel || '(default)'}`);
