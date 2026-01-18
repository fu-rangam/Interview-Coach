
import handler from '../api/generate-blueprint';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load Env
const loadEnv = (file) => {
    const p = path.resolve(rootDir, file);
    if (fs.existsSync(p)) {
        console.log(`Loading env from ${file}`);
        const content = fs.readFileSync(p, 'utf8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim().replace(/"/g, ''); // simple unquote
                if (key && !key.startsWith('#')) {
                    process.env[key] = val;
                }
            }
        });
    }
};

loadEnv('.env');
loadEnv('.env.local');

if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY not found in env files.");
    process.exit(1);
}

// Mock Req/Res
const req = {
    method: 'POST',
    headers: {},
    body: {
        role: "Certified Home Health Aide",
        jobDescription: "Help patients with daily living.",
        seniority: "Entry"
    }
};

const res = {
    statusCode: 200,
    status: function (code) {
        this.statusCode = code;
        return this;
    },
    json: function (data) {
        console.log(`\n--- API RESPONSE (${this.statusCode}) ---`);
        console.log(JSON.stringify(data, null, 2));

        // Validation Check
        if (data.competencies) {
            const missingWeights = data.competencies.filter(c => c.weight === undefined);
            console.log(`\nValidation: ${missingWeights.length} competencies missing weights.`);
            data.competencies.forEach(c => {
                console.log(`- ${c.name}: Weight=${c.weight}, Bands=${c.bands ? Object.keys(c.bands).join(',') : 'MISSING'}`);
            });
        }
        return this;
    },
    end: function () { }
};

console.log("Invoking handler...");
handler(req, res).then(() => console.log("Done."));
