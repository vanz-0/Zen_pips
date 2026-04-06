import dotenv from 'dotenv';
dotenv.config();

async function showTemplateStatus() {
    const brevoApiKey = process.env.BREVO_API_KEY;
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/templates', {
            method: 'GET',
            headers: { 'accept': 'application/json', 'api-key': brevoApiKey }
        });
        const result = await response.json();
        if (response.ok) {
            console.log('✅ Templates Summary:');
            result.templates.forEach(t => {
                console.log(`ID: ${t.id} | Name: ${t.name} | Active: ${t.isActive} | Sender: ${t.sender.email}`);
            });
        }
    } catch (e) { console.error(e); }
}

showTemplateStatus();
