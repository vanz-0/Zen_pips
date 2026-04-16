import { Config, Context } from "@netlify/functions";

// This function runs automatically based on the schedule below
export default async (req: Request, context: Context) => {
    const { next_run } = context;
    console.log(`[ZEN PIPS CRON] Running Autonomous Audit. Next run: ${next_run}`);

    const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zenpips.net';

    try {
        // 1. Trigger News & Sentiment Audit
        const newsResponse = await fetch(`${API_URL}/api/news`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        // 2. Trigger Signal & SL Protection Checks (if bridge logic is exposed)
        // We trigger the internal logic that checks for SL hits and moves
        const auditResponse = await fetch(`${API_URL}/api/cron/signals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`[ZEN PIPS CRON] Audit Complete. Status: ${newsResponse.status} / ${auditResponse.status}`);
        
        return new Response("Institutional Audit Success", { status: 200 });
    } catch (err) {
        console.error("[ZEN PIPS CRON] Audit Failed:", err);
        return new Response("Audit Failed", { status: 500 });
    }
};

// Schedule it to run every hour
export const config: Config = {
    schedule: "@hourly"
};
