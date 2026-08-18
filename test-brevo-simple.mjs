import dotenv from 'dotenv';
dotenv.config();

async function testSimple() {
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
        console.error('❌ Missing BREVO_API_KEY');
        process.exit(1);
    }
    
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'api-key': brevoApiKey
            },
            body: JSON.stringify({
                sender: { email: 'morganjeff3111@gmail.com', name: 'Zen Pips' },
                to: [{ email: 'onehealthessentials@gmail.com', name: 'Test User' }],
                subject: 'Test Email Verification',
                htmlContent: '<p>This is a test to verify the new Brevo API key is working.</p>'
            })
        });

        const result = await response.json();
        if (response.ok) {
            console.log('✅ TEST EMAIL SENT SUCCESSFULLY!');
            console.log('Message ID:', result.messageId);
        } else {
            console.error('❌ FAILED TO SEND EMAIL:', result);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testSimple();
