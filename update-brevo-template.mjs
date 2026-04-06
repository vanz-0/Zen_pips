import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function updateTemplate() {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        console.error("No BREVO_API_KEY found.");
        return;
    }

    const htmlContent = fs.readFileSync('template.html', 'utf8');

    const response = await fetch('https://api.brevo.com/v3/smtp/templates/1', {
        method: 'PUT',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            htmlContent: htmlContent,
            subject: 'Welcome to the Inner Circle 📈',
            sender: {
                name: 'Zen Pips',
                email: 'morganjeff3111@gmail.com'
            }
        })
    });

    if (!response.ok) {
        console.error("Failed to update template:");
        console.error(await response.text());
        return;
    }

    console.log("Template updated successfully!");
}

updateTemplate();
