import dotenv from 'dotenv';
dotenv.config();

async function getEmailEvents(email) {
    console.log(`🔍 Fetching email events for: ${email}`);
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (!brevoApiKey) {
        console.error('❌ Missing BREVO_API_KEY in .env');
        process.exit(1);
    }

    try {
        const response = await fetch(`https://api.brevo.com/v3/smtp/statistics/events?email=${encodeURIComponent(email)}&limit=10`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'api-key': brevoApiKey
            }
        });

        const result = await response.json();
        if (response.ok) {
            console.log('✅ Events found:');
            console.log(JSON.stringify(result.events, null, 2));
        } else {
            console.error('❌ Failed to fetch events:', result);
        }
    } catch (error) {
        console.error('❌ Error fetching events:', error);
    }
}

const testEmail = 'onehealthessentials@gmail.com';
getEmailEvents(testEmail);
