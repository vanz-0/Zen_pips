/**
 * Institutional Support Logger
 * Focus: Critical Failures Only (Execution, API Blocks, Auth Failures)
 * Alerts: Telegram Support Bot (@8658303354)
 */

export async function logCriticalFailure(context: string, error: any) {
    const message = `🚨 **CRITICAL SYSTEM FAILURE** \n\nContext: ${context}\nError: ${error.message || JSON.stringify(error)}\nTimestamp: ${new Date().toISOString()}`;
    
    console.error(message);

    try {
        const token = process.env.SUPPORT_BOT_TOKEN;
        const adminId = process.env.SUPPORT_BOT_ADMIN_ID; // The admin's handle or numeric ID

        if (!token) return;

        // Note: In a real production environment, we'd use a queued background job
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: adminId || "@MadDmakz",
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error("Support Logger Failed:", e);
    }
}
