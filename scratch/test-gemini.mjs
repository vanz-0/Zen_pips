import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const geminiApiKey = process.env.GEMINI_API_KEY;
console.log('Using API key:', geminiApiKey ? 'FOUND' : 'MISSING');

const gemini = new GoogleGenAI({ apiKey: geminiApiKey });

// 1x1 transparent pixel base64
const dummyBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

try {
    const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [
                { text: 'Analyze this chart.' },
                { inlineData: { mimeType: 'image/gif', data: dummyBase64 } }
            ]
        }],
        config: { temperature: 0.1, maxOutputTokens: 100 }
    });

    console.log('SUCCESS!');
    console.log(response.candidates?.[0]?.content?.parts?.[0]?.text);
} catch (e) {
    console.error('FAILED WITH ERROR:', e);
}
