import { sendTelegramMessage } from '../telegram.mjs';

const sig = { pair: 'BTC/USD', direction: 'BUY', entry: '78422', sl: '77642.62', tp1: '79201.38', tp2: '79980.75', tp3: '80760.13' };

async function broadcast() {
  const text = `🚨 *INSTITUTIONAL ALERT: ${sig.pair}*\n\nDirection: ${sig.direction} 📈\nEntry: ${sig.entry}\nSL: ${sig.sl}\nTP1: ${sig.tp1} (1:1 RR) ✅\nTP2: ${sig.tp2} (1:2 RR) ✅\nTP3: ${sig.tp3} (1:3 RR) ✅\n\n*Institutional Edge: Demand Zone Mitigation + NY Volume*\n\n_Trade with logic, not emotions. 🧠🇮🇹 Stay disciplined._\n\n#ZENPIPS #SIGNAL #BTCUSD`;
  console.log(`Sending ${sig.pair}...`);
  await sendTelegramMessage(text);
}

broadcast();
