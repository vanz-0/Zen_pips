import { sendTelegramMessage } from './telegram.mjs';

async function test() {
  console.log("Testing Telegram integration...");
  await sendTelegramMessage("🤖 *ZEN PIPS SYSTEM TEST*\n\nSignal Bridge verification in progress...\n\n_If you see this, the integration is working!_");
  console.log("Test message sent. Please check the channel.");
}

test();
