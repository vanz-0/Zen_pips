import dotenv from 'dotenv';
dotenv.config();

async function getTemplate() {
    const brevoApiKey = process.env.BREVO_API_KEY;
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/templates/1', {
            method: 'GET',
            headers: { 'accept': 'application/json', 'api-key': brevoApiKey }
        });
        const result = await response.json();
        if (response.ok) {
            console.log(result.htmlContent);
        } else {
            console.error('Failed to fetch:', result);
        }
    } catch (e) { console.error(e); }
}

getTemplate();
