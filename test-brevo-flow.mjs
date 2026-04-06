import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testBrevoFlow() {
    console.log('🚀 Triggering Brevo Email Flow...');
    const brevoApiKey = process.env.BREVO_API_KEY;
    const testEmail = 'onehealthessentials@gmail.com';
    const pdfPath = path.join(__dirname, 'public', 'ZenPips_Institutional_Guide.pdf');

    if (!brevoApiKey) {
        console.error('❌ Missing BREVO_API_KEY in .env');
        process.exit(1);
    }

    if (!fs.existsSync(pdfPath)) {
        console.error('❌ PDF not found at', pdfPath);
        process.exit(1);
    }

    const pdfBase64 = fs.readFileSync(pdfPath).toString('base64');

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'api-key': brevoApiKey
            },
            body: JSON.stringify({
                sender: { email: 'morganjeff3111@gmail.com', name: 'Zen Pips Institutional' },
                to: [{ email: testEmail, name: 'Valued Trader' }],
                templateId: 1,
                params: {
                    FIRSTNAME: 'Partner',
                    GUIDE_LINK: 'https://zenpips.com/ZenPips_Institutional_Guide.pdf'
                },
                attachment: [
                    {
                        content: pdfBase64,
                        name: 'Institutional_Market_Structure_Guide.pdf'
                    }
                ]
            })
        });

        const result = await response.json();
        if (response.ok) {
            console.log('✅ TEST EMAIL SENT SUCCESSFULLY!');
            console.log('Recipient:', testEmail);
            console.log('Message ID:', result.messageId);
        } else {
            console.error('❌ FAILED TO SEND EMAIL:', result);
        }
    } catch (error) {
        console.error('❌ Error in Brevo flow:', error);
    }
}

testBrevoFlow();
