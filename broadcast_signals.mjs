import { sendTelegramMessage } from './telegram.mjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STATUS_EMOJI = {
  'ACTIVE': '🟢',
  'TP1_HIT': '✅',
  'TP2_HIT': '✅✅',
  'ALL_TPS_HIT': '🏆',
  'SL_HIT': '🔴',
  'CANCELLED': '⚪',
  'ARCHIVED': '📦',
};

const DIRECTION_EMOJI = {
  'BUY': '📈',
  'SELL': '📉',
};

function formatSignalMessage(signal) {
  const emoji = STATUS_EMOJI[signal.status] || '📊';
  const dirEmoji = DIRECTION_EMOJI[signal.direction] || '';
  const pair = signal.pair;

  // Active signal — full entry card
  if (signal.status === 'ACTIVE') {
    return [
      `${emoji} *NEW SIGNAL: ${pair}*`,
      ``,
      `*Direction:* ${signal.direction} ${dirEmoji}`,
      `*Entry:* ${signal.entry}`,
      `*SL:* ${signal.sl}`,
      `*TP1:* ${signal.tp1}`,
      `*TP2:* ${signal.tp2}`,
      `*TP3:* ${signal.tp3}`,
      ``,
      `_Institutional precision. Manage risk accordingly._`,
    ].join('\n');
  }

  // TP1 hit
  if (signal.status === 'TP1_HIT' || signal.tp1_hit) {
    const pips = signal.total_pips || '—';
    return [
      `${emoji} *TP1 HIT: ${pair}*`,
      ``,
      `*Direction:* ${signal.direction} ${dirEmoji}`,
      `*Entry:* ${signal.entry}`,
      `*TP1:* ${signal.tp1} ✅`,
      ``,
      `💰 *Pips Secured: +${pips}*`,
      `🛡️ SL moved to breakeven.`,
      ``,
      `*Remaining Targets:*`,
      `🎯 TP2: ${signal.tp2}`,
      `🎯 TP3: ${signal.tp3}`,
    ].join('\n');
  }

  // All TPs hit (full victory)
  if (signal.status === 'ALL_TPS_HIT') {
    const pips = signal.total_pips || '—';
    return [
      `🏆 *FULL CYCLE VICTORY: ${pair}*`,
      ``,
      `*Direction:* ${signal.direction} ${dirEmoji}`,
      `*Entry:* ${signal.entry}`,
      `*TP1:* ${signal.tp1} ✅`,
      `*TP2:* ${signal.tp2} ✅`,
      `*TP3:* ${signal.tp3} ✅`,
      ``,
      `💰 *Total Pips: +${pips}*`,
      `✅ Maximum yield extracted. Trade closed.`,
      ``,
      `_Institutional execution at its finest._`,
    ].join('\n');
  }

  // SL hit
  if (signal.status === 'SL_HIT') {
    return [
      `🔴 *SL HIT: ${pair}*`,
      ``,
      `*Direction:* ${signal.direction} ${dirEmoji}`,
      `*Entry:* ${signal.entry}`,
      `*SL:* ${signal.sl} ❌`,
      ``,
      `_Risk was managed. Moving forward._`,
    ].join('\n');
  }

  // Fallback
  return `${emoji} *${pair}* — Status: ${signal.status}`;
}

async function broadcastUpdates() {
  console.log("🔍 Fetching recent signal updates from Supabase...\n");

  // Fetch signals updated in the last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: signals, error } = await supabase
    .from('signals')
    .select('*')
    .or(`status.neq.ARCHIVED,created_at.gte.${yesterday}`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return;
  }

  if (!signals || signals.length === 0) {
    console.log("No recent signals to broadcast.");
    return;
  }

  console.log(`📡 Broadcasting ${signals.length} signal update(s)...\n`);

  for (const signal of signals) {
    const message = formatSignalMessage(signal);
    console.log(`→ ${signal.pair} [${signal.status}]`);
    await sendTelegramMessage(message);
    await delay(1500); // Rate limit safety
  }

  // Session recap
  const victories = signals.filter(s => s.status === 'ALL_TPS_HIT');
  const active = signals.filter(s => s.status === 'ACTIVE');
  const losses = signals.filter(s => s.status === 'SL_HIT');

  if (signals.length > 1) {
    const recap = [
      `🔥 *SESSION RECAP*`,
      ``,
      `📊 *${signals.length} Signals Tracked*`,
      ``,
      victories.length > 0 ? `🏆 Victories: ${victories.length}` : null,
      active.length > 0 ? `🟢 Active: ${active.length}` : null,
      losses.length > 0 ? `🔴 Stopped Out: ${losses.length}` : null,
      ``,
      `_Stay disciplined, Dominators. 🧘‍♂️_`,
    ].filter(Boolean).join('\n');

    await sendTelegramMessage(recap);
  }

  console.log("\n✅ All Telegram broadcasts sent!");
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

broadcastUpdates();
