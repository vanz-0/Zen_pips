import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function testTelegram() {
    const botToken = process.env.SUPPORT_BOT_TOKEN;
    // Extract channel ID or use the URL logic if your broadcast uses an ID.
    // NOTE: Sending via Telegram API usually requires a Chat ID (e.g., -100...).
    const channelId = process.env.ZENPIPS_CHANNEL_ID; 

    console.log("Testing Telegram Bot Configuration...");
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const data = await response.json();
        console.log("Bot Info:", data);
        
        if(data.ok) {
            console.log("✅ Telegram Bot Token is valid!");
        } else {
            console.log("❌ Bot Token invalid:", data);
        }
    } catch (error) {
        console.error("Error testing bot:", error);
    }
}

testTelegram();
