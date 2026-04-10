import os
import requests
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv('.env')
url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(url, key)

def broadcast_update(message):
    print(f"BROADCAST: {message}")
    # Update Community
    supabase.table('community_messages').insert({
        'content': message,
        'channel': 'setups-and-charts'
    }).execute()

def sync_trailing_stops():
    print("=== Institutional Trailing Stop Calibration ===")
    
    # Fetch Active Signals
    signals = supabase.table('signals').select('*').eq('status', 'ACTIVE').execute().data
    
    for sig in signals:
        updated = False
        ticker = sig['ticker']
        
        # Logic 1: GBPUSD specific request
        if ticker == 'GBPUSD':
            # User instruction: Trail SL to TP1
            if sig['current_sl'] != sig['tp1']:
                print(f"[{ticker}] Securing Capital. Moving SL to TP1 ({sig['tp1']})")
                supabase.table('signals').update({'current_sl': sig['tp1']}).eq('id', sig['id']).execute()
                broadcast_update(f"GBP/USD VICTORY: Stop Loss moved to TP1 ({sig['tp1']}). Profits secured.")
                updated = True

        # Logic 2: Risk-Free at TP2
        # If the signal has hit TP2, move SL to Entry
        if sig.get('tp2_hit') or (sig.get('is_hit_tp2', False)):
            if sig['current_sl'] != sig['entry']:
                print(f"[{ticker}] TP2 HIT. Moving SL to Entry ({sig['entry']}) for Risk-Free Trade.")
                supabase.table('signals').update({'current_sl': sig['entry']}).eq('id', sig['id']).execute()
                broadcast_update(f"{ticker} UPDATE: TP2 achieved. Stop Loss moved to Entry. Trade is now RISK-FREE.")
                updated = True
        
        # Add to copy_events for MT5 Bridge
        if updated:
             supabase.table('copy_events').insert({
                 'signal_id': sig['id'],
                 'status': 'PENDING',
                 'error_message': 'Trailing Stop Update'
             }).execute()

if __name__ == "__main__":
    sync_trailing_stops()
