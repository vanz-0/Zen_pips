import os
import time
import MetaTrader5 as mt5
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

# Load Configurations
load_dotenv('.env')
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
MT5_LOGIN = int(os.getenv('MT5_LOGIN', 0))
MT5_PASSWORD = os.getenv('MT5_PASSWORD')
MT5_SERVER = os.getenv('MT5_SERVER')

# Initialize Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def log_critical(message):
    print(f"CRITICAL: {message}")
    # Placeholder for Support Bot integration
    try:
        token = os.getenv('SUPPORT_BOT_TOKEN')
        admin_id = os.getenv('SUPPORT_BOT_ADMIN_ID')
        if token and admin_id:
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            requests.post(url, json={'chat_id': admin_id, 'text': f"🚨 CRITICAL BRIDGE ERROR: {message}"})
    except:
        pass

def community_sync(ticker, action):
    try:
        msg = f"🚀 **INSTITUTIONAL EXECUTION**: {ticker} {action}. Discuss the entry and confluences below."
        supabase.table('community_messages').insert({
            'content': msg,
            'channel': 'setups-and-charts',
            'user_id': 'system'
        }).execute()
        print(f"Social Mirroring Active: {ticker}")
    except Exception as e:
        print(f"Community Sync Error: {e}")

def execute_on_mt5():
    # 1. Connect to MT5
    if not mt5.initialize(login=MT5_LOGIN, password=MT5_PASSWORD, server=MT5_SERVER):
        log_critical(f"MT5 Initialization Failed: {mt5.last_error()}")
        return

    print(f"--- Zen Pips Institutional Bridge Active (Account: {MT5_LOGIN}) ---")

    while True:
        try:
            # 2. Fetch Active Signals without a local ticket ID
            signals = supabase.table('signals').select('*').eq('status', 'ACTIVE').is_('mt5_ticket', 'null').execute().data
            
            for sig in signals:
                ticker = sig['ticker']
                # Standardize ticker for Vantage (e.g., Gold -> XAUUSD)
                symbol = ticker.replace('/', '')
                
                # Check symbol in MT5
                symbol_info = mt5.symbol_info(symbol)
                if not symbol_info:
                    print(f"Symbol {symbol} not found on server.")
                    continue
                
                if not symbol_info.visible:
                    mt5.symbol_select(symbol, True)

                # 3. Construct Order (Buy/Sell)
                order_type = mt5.ORDER_TYPE_BUY if sig['type'] == 'BUY' else mt5.ORDER_TYPE_SELL
                price = mt5.symbol_info_tick(symbol).ask if order_type == mt5.ORDER_TYPE_BUY else mt5.symbol_info_tick(symbol).bid
                
                request = {
                    "action": mt5.TRADE_ACTION_DEAL,
                    "symbol": symbol,
                    "volume": 0.1, # Institutional Default 
                    "type": order_type,
                    "price": price,
                    "sl": sig['sl'],
                    "tp": sig['tp3'],
                    "magic": 202611,
                    "comment": "ZenPips Institutional",
                    "type_time": mt5.ORDER_TIME_GTC,
                    "type_filling": mt5.ORDER_FILLING_IOC,
                }

                # 4. Execute
                result = mt5.order_send(request)
                if result.retcode != mt5.TRADE_RETCODE_DONE:
                    log_critical(f"Execution Error {symbol}: {result.comment}")
                else:
                    print(f"✅ EXECUTION SUCCESS: {symbol} at {price}")
                    # Update Website Mirror
                    supabase.table('signals').update({'mt5_ticket': result.order, 'executed_at': datetime.now().isoformat()}).eq('id', sig['id']).execute()
                    # Trigger Community Discussion
                    community_sync(ticker, f"Position opened at {price}")

            # 5. Trailing Stop Logic (TP1 -> SL@Entry, TP2 -> SL@TP1)
            active_positions = supabase.table('signals').select('*').eq('status', 'ACTIVE').not_('mt5_ticket', 'is', 'null').execute().data
            
            for pos in active_positions:
                symbol = pos['ticker'].replace('/', '')
                # Get current MT5 position status
                mt5_pos = mt5.positions_get(ticket=pos['mt5_ticket'])
                
                if mt5_pos:
                    # Trailing Logic Step 1: TP1 Hit -> SL to Entry
                    if pos.get('tp1_hit') and pos['current_sl'] != pos['entry']:
                        print(f"[{symbol}] TP1 HIT. Moving SL to Entry for Risk-Free Trade.")
                        request = {
                            "action": mt5.TRADE_ACTION_SLTP,
                            "position": pos['mt5_ticket'],
                            "sl": pos['entry'],
                            "tp": pos['tp3']
                        }
                        mt5.order_send(request)
                        supabase.table('signals').update({'current_sl': pos['entry']}).eq('id', pos['id']).execute()
                        community_sync(pos['ticker'], "Trade is now RISK-FREE (SL at Entry)")

                    # Trailing Logic Step 2: TP2 Hit -> SL to TP1
                    elif pos.get('tp2_hit') and pos['current_sl'] != pos['tp1']:
                        print(f"[{symbol}] TP2 HIT. Securing Profits at TP1.")
                        request = {
                            "action": mt5.TRADE_ACTION_SLTP,
                            "position": pos['mt5_ticket'],
                            "sl": pos['tp1'],
                            "tp": pos['tp3']
                        }
                        mt5.order_send(request)
                        supabase.table('signals').update({'current_sl': pos['tp1']}).eq('id', pos['id']).execute()
                        community_sync(pos['ticker'], "PROFITS SECURED (SL moved to TP1)")

        except Exception as e:
            log_critical(f"Bridge Loop Error: {e}")
        
        time.sleep(10) # 10 second institutional heartbeat

if __name__ == "__main__":
    execute_on_mt5()
