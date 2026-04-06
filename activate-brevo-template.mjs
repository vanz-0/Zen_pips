import dotenv from 'dotenv';
dotenv.config();

async function activateTemplate(templateId) {
    const brevoApiKey = process.env.BREVO_API_KEY;
    console.log(`🚀 Activating Brevo Template ID: ${templateId}...`);
    
    try {
        const response = await fetch(`https://api.brevo.com/v3/smtp/templates/${templateId}`, {
            method: 'PUT',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'api-key': brevoApiKey
            },
            body: JSON.stringify({
                isActive: true
            })
        });

        if (response.ok) {
            console.log(`✅ Template ID ${templateId} successfully ACTIVATED!`);
        } else {
            const error = await response.json();
            console.error(`❌ Failed to activate template:`, error);
        }
    } catch (e) {
        console.error('❌ Error activating template:', e);
    }
}

activateTemplate(1);
