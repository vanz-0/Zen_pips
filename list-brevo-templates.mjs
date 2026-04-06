import dotenv from 'dotenv';
dotenv.config();

async function listTemplates() {
    console.log('🔍 Fetching all email templates from Brevo...');
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (!brevoApiKey) {
        console.error('❌ Missing BREVO_API_KEY in .env');
        process.exit(1);
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/templates', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'api-key': brevoApiKey
            }
        });

        const result = await response.json();
        if (response.ok) {
            console.log('✅ Templates found:');
            console.log(JSON.stringify(result.templates, null, 2));
        } else {
            console.error('❌ Failed to fetch templates:', result);
        }
    } catch (error) {
        console.error('❌ Error fetching templates:', error);
    }
}

listTemplates();
