import dotenv from 'dotenv';
dotenv.config();

async function checkMessageStatus(messageId) {
    console.log(`🔍 Checking status for message: ${messageId}`);
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (!brevoApiKey) {
        console.error('❌ Missing BREVO_API_KEY in .env');
        process.exit(1);
    }

    try {
        // Correct endpoint for message status is /smtp/emails/{messageId} or /smtp/statistics/reports
        // However, Brevo also has a dedicated report endpoint.
        const response = await fetch(`https://api.brevo.com/v3/smtp/emails/${encodeURIComponent(messageId)}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'api-key': brevoApiKey
            }
        });

        const result = await response.json();
        if (response.ok) {
            console.log('✅ Message Details:');
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.error('❌ Failed to fetch message status:', result);
        }
    } catch (error) {
        console.error('❌ Error fetching message status:', error);
    }
}

// I'll need the messageId from the previous run output. 
// I'll grab it from the logs if possible, or I'll just run a fresh test and check.
const lastMessageId = process.argv[2];
if (lastMessageId) {
    checkMessageStatus(lastMessageId);
} else {
    console.log("Usage: node check-brevo-status.mjs <messageId>");
}
