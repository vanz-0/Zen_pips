import { sendTelegramMessage } from '../telegram.mjs';

const signals = [
  { pair: 'XAG/USD', direction: 'BUY', entry: '76.71', sl: '74.56', tp1: '78.87', tp2: '81.02', tp3: '83.17' },
  { pair: 'XAU/USD', direction: 'BUY', entry: '4729.07', sl: '4695.07', tp1: '4763.06', tp2: '4797.06', tp3: '4831.06' },
  { pair: 'EUR/USD', direction: 'BUY', entry: '1.17041', sl: '1.16880', tp1: '1.17300', tp2: '1.17500', tp3: '1.17700' },
  { pair: 'GBP/USD', direction: 'BUY', entry: '1.35077', sl: '1.34880', tp1: '1.35300', tp2: '1.35500', tp3: '1.35700' },
  { pair: 'BTC/USD', direction: 'SELL', entry: '77764.5', sl: '78217.5', tp1: '77311.5', tp2: '76858.5', tp3: '76405.5' }
];

async function broadcast() {
  for (const sig of signals) {
    const text = `🚨 *NEW INSTITUTIONAL SETUP: ${sig.pair}*\nDirection: ${sig.direction}\nEntry: ${sig.entry}\nSL: ${sig.sl}\nTP1: ${sig.tp1} | TP2: ${sig.tp2} | TP3: ${sig.tp3}\n\n*Status: ACTIVE | Timeframe: M15*`;
    console.log(`Sending ${sig.pair}...`);
    await sendTelegramMessage(text);
  }
}

broadcast();
