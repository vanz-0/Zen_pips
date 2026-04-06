import dotenv from 'dotenv';
dotenv.config();

async function listSenders() {
    console.log('🔍 Fetching verified senders from Brevo...');
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (!brevoApiKey) {
        console.error('❌ Missing BREVO_API_KEY in .env');
        process.exit(1);
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/senders', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'api-key': brevoApiKey
            }
        });

        const result = await response.json();
        if (response.ok) {
            console.log('✅ Senders found:');
            console.log(JSON.stringify(result.senders, null, 2));
        } else {
            console.error('❌ Failed to fetch senders:', result);
        }
    } catch (error) {
        console.error('❌ Error fetching senders:', error);
    }
}

listSenders();
