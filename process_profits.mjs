import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import { sendTelegramMessage } from './telegram.mjs';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const brain_dir = 'C:/Users/Admin/.gemini/antigravity/brain/ca166f27-31bd-4bff-b574-0ba60291ae7d/';

const updates = [
    {
        asset: 'Gold (XAU/USD)',
        image: brain_dir + 'media__1776126772333.png',
        db_id: '54d8fa34-ab22-4782-a350-0344b9c14b09',
        updateData: { tp1_hit: true, current_sl: 4734.25 },
        telegramMsg: `🏆 *UPDATE: XAU/USD (Gold)*\n\nGold has successfully hit TP1! Stop Loss has been moved to the entry point (Risk Free). Let the runners ride! 🚀`,
        communityMsg: `🔥 **Gold (XAU/USD) Update**\n\nTP1 secured! Stop Loss is now at breakeven. Great price action playing out exactly as mapped.`
    },
    {
        asset: 'Silver (XAG/USD)',
        image: brain_dir + 'media__1776126830209.png',
        db_id: '58d328e0-8c11-491f-adc8-b85309acc0d5',
        updateData: {}, // Just on its way
        telegramMsg: `👀 *UPDATE: XAG/USD (Silver)*\n\nSilver is moving beautifully and is on its way to TP1. Institutional flow in clear control. 📈`,
        communityMsg: `💎 **Silver (XAG/USD) Update**\n\nCurrently en route to TP1. Momentum is solid. Stick to the plan.`
    },
    {
        asset: 'EUR/USD',
        image: brain_dir + 'media__1776126858515.png',
        db_id: 'ba1813de-926c-4d01-9253-a9da9490e8ce',
        updateData: { tp1_hit: true, tp2_hit: true, current_sl: 1.1730 },
        telegramMsg: `🔥 *UPDATE: EUR/USD*\n\nMassive move! EUR/USD has smashed through TP1 and TP2. Stop Loss is safely locked at TP1. 💰`,
        communityMsg: `⚡ **EUR/USD Update**\n\nTP1 and TP2 hit! Stop Loss moved to TP1 to secure deep profits. European session volume delivered.`
    },
    {
        asset: 'GBP/USD',
        image: brain_dir + 'media__1776126897171.png',
        db_id: '30281d66-e050-43df-9447-9dbc12597ba1',
        updateData: { tp1_hit: true, tp2_hit: true, tp3_hit: true, closed: true, status: 'TOTAL VICTORY', total_pips: 90 },
        telegramMsg: `💎 *TOTAL VICTORY: GBP/USD*\n\nFull profit order! All three Take Profits have been hit flawlessly. Closing out for a massive win! 🎯🎉`,
        communityMsg: `🏆 **GBP/USD FULL PROFIT**\n\nAbsolute clinical execution. All three targets hit perfectly. Lock it in and enjoy the profits team! 💸`
    },
    {
        asset: 'Bitcoin (BTC/USD)',
        image: brain_dir + 'media__1776126955561.png',
        db_id: '16b3b9c2-8695-4faa-b786-d7ccba2fb8f1',
        updateData: { tp1_hit: true, tp2_hit: true, current_sl: 73114.5 },
        telegramMsg: `🚀 *UPDATE: BTC/USD*\n\nBitcoin pushing hard! TP1 and TP2 have been hit. Stop Loss moved up to TP1. Ride the liquidations! ₿`,
        communityMsg: `🚀 **Bitcoin Update**\n\nTP1 and TP2 secured. Liquidation zones mapped earlier were pinpoint accurate. Stop Loss at TP1 now.`
    }
];

async function main() {
    for (const item of updates) {
        console.log(`\n--- Processing ${item.asset} ---`);
        
        let publicUrl = null;
        if (fs.existsSync(item.image)) {
            const fileName = `signal_charts/profit_update_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
            const fileData = fs.readFileSync(item.image);
            
            const { error: uploadError } = await supabase.storage
                .from('charts')
                .upload(fileName, fileData, { contentType: 'image/png' });
                
            if (uploadError) {
                console.error("Upload error:", uploadError);
            } else {
                const { data } = supabase.storage.from('charts').getPublicUrl(fileName);
                publicUrl = data.publicUrl;
                console.log(`✅ Image uploaded: ${publicUrl}`);
            }
        } else {
            console.error(`❌ Image not found: ${item.image}`);
        }

        if (Object.keys(item.updateData).length > 0) {
            const { error: dbError } = await supabase
                .from('signals')
                .update(item.updateData)
                .eq('id', item.db_id);
                
            if (dbError) {
                console.error("DB update error:", dbError);
            } else {
                console.log(`✅ Database updated`);
            }
        }

        const { error: commError } = await supabase
            .from('community_messages')
            .insert({
                user_id: '00000000-0000-0000-0000-000000000000',
                channel: 'setups-and-charts',
                content: item.communityMsg,
                image: publicUrl
            });
            
        if (commError) {
            console.error("Community post error:", commError);
        } else {
            console.log(`✅ Posted to Community Dashboard`);
        }
        
        await sendTelegramMessage(item.telegramMsg);
    }
}

main().catch(console.error);
