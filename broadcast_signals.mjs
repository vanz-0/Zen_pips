import { sendTelegramMessage } from './telegram.mjs';

async function broadcastUpdates() {
  console.log("Broadcasting today's signal updates to Telegram...\n");

  // 1. BTC/USD TP1 Hit
  await sendTelegramMessage(`✅ *TP1 HIT: BTC/USD (Bitcoin)*\n\n*Direction:* BUY 📈\n*Entry:* 72,103.5\n*TP1:* 73,430.58 ✅\n\n💰 *Pips Secured: +1,327*\n🛡️ SL moved to breakeven.\n\n*Remaining Targets:*\n🎯 TP2: 74,757.67\n🎯 TP3: 76,084.75\n\n_Institutional liquidity sweep confirmed on M15._`);
  await delay(1500);

  // 2. XAU/USD TP1 Hit
  await sendTelegramMessage(`✅ *TP1 HIT: XAU/USD (Gold)*\n\n*Direction:* BUY 📈\n*Entry:* 4,756.8\n*TP1:* 4,775.18 ✅\n\n💰 *Pips Secured: +183.8*\n🛡️ SL moved to breakeven.\n\n*Remaining Targets:*\n🎯 TP2: 4,793.56\n🎯 TP3: 4,811.95\n\n_Strong bullish momentum continues._`);
  await delay(1500);

  // 3. XAG/USD TP1 Hit
  await sendTelegramMessage(`✅ *TP1 HIT: XAG/USD (Silver)*\n\n*Direction:* BUY 📈\n*Entry:* 75.28\n*TP1:* 76.43 ✅\n\n💰 *Pips Secured: +115*\n🛡️ SL moved to breakeven.\n\n*Remaining Targets:*\n🎯 TP2: 77.59\n🎯 TP3: 78.74\n\n_Trend validated. Running for TP2._`);
  await delay(1500);

  // 4. EUR/USD Full Cycle
  await sendTelegramMessage(`🏆 *FULL CYCLE VICTORY: EUR/USD*\n\n*Direction:* BUY 📈\n*Entry:* 1.16781\n*TP1:* 1.16850 ✅\n*TP2:* 1.16950 ✅\n*TP3:* 1.17116 ✅\n\n💰 *Total Pips: +33.5*\n✅ Maximum yield extracted. Trade closed.\n\n_Flawless institutional execution._`);
  await delay(1500);

  // 5. GBP/USD Full Cycle
  await sendTelegramMessage(`🏆 *FULL CYCLE VICTORY: GBP/USD*\n\n*Direction:* BUY 📈\n*Entry:* 1.34145\n*TP1:* 1.34300 ✅\n*TP2:* 1.34450 ✅\n*TP3:* 1.34600 ✅\n\n💰 *Total Pips: +45.5*\n✅ All targets achieved. Trade closed.\n\n_Institutional precision at its finest._`);
  await delay(1500);

  // 6. Summary
  await sendTelegramMessage(`🔥 *SESSION RECAP*\n\n📊 *5/5 Buy Signals — All Hit TP1 or Better*\n\n✅ BTC/USD: +1,327 pips (TP1 ✅)\n✅ XAU/USD: +183.8 pips (TP1 ✅)\n✅ XAG/USD: +115 pips (TP1 ✅)\n🏆 EUR/USD: +33.5 pips (TP3 ✅ CLOSED)\n🏆 GBP/USD: +45.5 pips (TP3 ✅ CLOSED)\n\n💎 *Total Day Pips: +1,704.8*\n\n_This is what institutional-grade execution looks like. Stay disciplined, Dominators. 🧘‍♂️_`);

  console.log("\nAll Telegram broadcasts sent!");
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

broadcastUpdates();
