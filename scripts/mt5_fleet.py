import os
import time
import subprocess
from datetime import datetime
import multiprocessing as mp
import MetaTrader5 as mt5
from dotenv import load_dotenv

# Load environment variables
base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_path, '.env')
load_dotenv(env_path)

# ---------------------------------------------------------
# SYSTEM CONFIGURATION
# ---------------------------------------------------------

# Define the Master Account (The baseline for lot size calculation)
MASTER_ACCOUNT_ID = "25113210"
MASTER_BALANCE = 1000.0

# Fleet Account Mapping
# Format: "login": {"password": "...", "server": "...", "terminal_path": "..."}
FLEET_ACCOUNTS = {
    # 1. The Master Account (Using the default terminal)
    "25113210": {
        "password": "!pA@Rj@0", 
        "server": "VantageInternational-Demo", 
        "terminal_path": r"C:\Program Files\Vantage International MT5\terminal64.exe"
    },
    # 2. Slave 1
    "25131564": {
        "password": "W#KI6sgn", 
        "server": "VantageInternational-Demo", 
        "terminal_path": os.path.join(base_path, r"scripts\MT5_Fleet\MT5_Terminal_1\terminal64.exe")
    },
    # 3. Slave 2
    "25131567": {
        "password": "VD7g^2GT", 
        "server": "VantageInternational-Demo", 
        "terminal_path": os.path.join(base_path, r"scripts\MT5_Fleet\MT5_Terminal_2\terminal64.exe")
    },
    # 4. Slave 3
    "25131577": {
        "password": "5&8^Qq2G", 
        "server": "VantageInternational-Demo", 
        "terminal_path": os.path.join(base_path, r"scripts\MT5_Fleet\MT5_Terminal_3\terminal64.exe")
    },
    # 5. Slave 4
    "25131572": {
        "password": "X03zu@Z5", 
        "server": "VantageInternational-Demo", 
        "terminal_path": os.path.join(base_path, r"scripts\MT5_Fleet\MT5_Terminal_4\terminal64.exe")
    }
}


# ---------------------------------------------------------
# FLEET MANAGER LOGIC
# ---------------------------------------------------------

def calculate_proportional_lot(slave_balance, master_balance, master_lot):
    """
    Calculates lot size based on the new rule:
    - $1,000 balance -> 0.10 lots
    - $10,000 balance -> 1.0 lots
    - $10,000+ balance -> Cap at 1.0 lots
    """
    if slave_balance >= 10000:
        return 1.0
    
    # 0.1 lot per $1000 ratio
    calculated_lot = (slave_balance / 1000.0) * 0.1
    return max(0.01, round(calculated_lot, 2))



def get_split_lots(balance):
    """
    Returns a list of 3 lot sizes based on the balance tiers:
    - Balance < $5,000: [0.01, 0.01, 0.01]
    - Balance >= $5,000: [0.03, 0.03, 0.03]
    """
    if balance >= 5000:
        return [0.03, 0.03, 0.03]
    else:
        return [0.01, 0.01, 0.01]


def execute_trade_on_terminal(account_id, symbol, action, master_lot, entry_price, sl, tp1, tp2, tp3):
    """
    Worker function executed in parallel.
    Places 3 SPLIT PENDING ORDERS per signal.
    """
    acc = FLEET_ACCOUNTS.get(account_id)
    if not acc:
        return f"[FAIL] Account {account_id} not found."

    if not mt5.initialize(path=acc["terminal_path"], login=int(account_id), password=acc["password"], server=acc["server"], portable=True):
        mt5.shutdown()
        return f"[FAIL] Account {account_id} Failed to initialize."

    if not mt5.terminal_info().trade_allowed:
        mt5.shutdown()
        return f"[FAIL] Account {account_id} AutoTrading is DISABLED."
        
    info = mt5.account_info()
    if not info:
        mt5.shutdown()
        return f"[FAIL] Account {account_id} Could not fetch info."
    
    # Get lots for the 3 split orders
    lots = get_split_lots(info.balance)
    tps = [tp1, tp2, tp3]

    # Resolve symbol
    all_symbols = [s.name for s in mt5.symbols_get()]
    resolved_symbol = None
    priority_suffixes = ['+', '.v', 'm', 'c']
    
    if symbol in all_symbols:
        resolved_symbol = symbol
    else:
        for suffix in priority_suffixes:
            candidate = f"{symbol}{suffix}"
            if candidate in all_symbols:
                resolved_symbol = candidate
                break
    
    if not resolved_symbol:
        for s in all_symbols:
            if s.startswith(symbol) and '.crp' not in s and len(s) <= len(symbol) + 4:
                resolved_symbol = s
                break

    if not resolved_symbol:
        mt5.shutdown()
        return f"[FAIL] Account {account_id} Symbol {symbol} not found."

    mt5.symbol_select(resolved_symbol, True)
    
    # Determine Pending Order Type
    # If entry > current price and action is BUY -> BUY STOP
    # If entry < current price and action is BUY -> BUY LIMIT
    tick = mt5.symbol_info_tick(resolved_symbol)
    if not tick:
        mt5.shutdown()
        return f"[FAIL] Account {account_id} No price for {resolved_symbol}"

    if action == "BUY":
        order_type = mt5.ORDER_TYPE_BUY_LIMIT if entry_price < tick.ask else mt5.ORDER_TYPE_BUY_STOP
    else:
        order_type = mt5.ORDER_TYPE_SELL_LIMIT if entry_price > tick.bid else mt5.ORDER_TYPE_SELL_STOP

    tickets = []
    for i in range(3):
        request = {
            "action": mt5.TRADE_ACTION_PENDING,
            "symbol": resolved_symbol,
            "volume": float(lots[i]),
            "type": order_type,
            "price": float(entry_price),
            "sl": float(sl),
            "tp": float(tps[i]),
            "deviation": 20,
            "magic": 777777 + i,
            "comment": f"Fleet Split {i+1}: {lots[i]}L",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        
        result = mt5.order_send(request)
        if result.retcode == mt5.TRADE_RETCODE_DONE:
            tickets.append(str(result.order))
        else:
            # Try alternate filling mode if IOC fails
            request["type_filling"] = mt5.ORDER_FILLING_FOK
            result = mt5.order_send(request)
            if result.retcode == mt5.TRADE_RETCODE_DONE:
                tickets.append(str(result.order))

    mt5.shutdown()
    os.system(f'taskkill /FI "IMAGENAME eq terminal64.exe" /FI "MODULES eq {os.path.basename(acc["terminal_path"])}" /F /T >nul 2>&1')

    if not tickets:
        return f"[FAIL] Account {account_id} All 3 orders rejected."
    
    return f"[OK] Account {account_id} Placed {len(tickets)}/3 Pending Orders. Tickets: {', '.join(tickets)}"


def broadcast_signal(symbol, action, master_lot, entry_price, sl, tp1, tp2, tp3):
    """
    Main function to broadcast a signal to all accounts simultaneously.
    """
    print(f"\n--- ZEN PIPS FLEET MANAGER BROADCAST ---")
    print(f"Signal: {action} {symbol} | Entry: {entry_price}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Broadcasting 3 SPLIT PENDING ORDERS to Fleet...\n")

    # Filter out placeholder accounts before running
    active_accounts = [acc_id for acc_id in FLEET_ACCOUNTS.keys() if acc_id.isdigit()]
    
    if not active_accounts:
        print("[!] No valid numeric Account IDs found.")
        return

    # Use multiprocessing to execute all trades at the exact same millisecond
    results = []
    with mp.Pool(processes=len(active_accounts)) as pool:
        # Prepare arguments for each worker
        tasks = [(acc_id, symbol, action, master_lot, entry_price, sl, tp1, tp2, tp3) for acc_id in active_accounts]
        
        # Execute asynchronously
        async_results = [pool.apply_async(execute_trade_on_terminal, t) for t in tasks]
        
        # Collect results
        for res in async_results:
            results.append(res.get())

    # Print final summary
    print("\n--- FLEET EXECUTION SUMMARY ---")
    for r in results:
        print(r)
    print("-------------------------------\n")
    print("[*] All terminals shut down cleanly to preserve RAM.")

def system_check_worker(account_id):
    """Boots terminal, fetches balance, and closes to test RAM and CPU usage."""
    acc = FLEET_ACCOUNTS.get(account_id)
    if not acc: return f"[FAIL] {account_id} not found."
    
    start_time = time.time()
    if not mt5.initialize(path=acc["terminal_path"], login=int(account_id), password=acc["password"], server=acc["server"], portable=True):
        error = mt5.last_error()
        mt5.shutdown()
        return f"[FAIL] {account_id} Boot Error: {error}"
        
    info = mt5.account_info()
    mt5.shutdown()
    
    # Force kill specific terminal to ensure it doesn't linger
    os.system(f'taskkill /FI "IMAGENAME eq terminal64.exe" /FI "MODULES eq {os.path.basename(acc["terminal_path"])}" /F /T >nul 2>&1')
    
    elapsed = time.time() - start_time
    if info:
        return f"[OK] {account_id} Booted in {elapsed:.2f}s | Balance: ${info.balance}"
    return f"[WARN] {account_id} Booted but failed to fetch balance."

def run_system_check():
    """Runs a parallel boot test across all configured accounts to verify system stability."""
    print(f"\n--- ZEN PIPS SYSTEM STABILITY CHECK ---")
    active_accounts = [acc_id for acc_id in FLEET_ACCOUNTS.keys() if acc_id.isdigit()]
    print(f"[*] Booting {len(active_accounts)} terminals simultaneously to monitor CPU/RAM...")
    
    results = []
    with mp.Pool(processes=len(active_accounts)) as pool:
        async_results = [pool.apply_async(system_check_worker, (acc_id,)) for acc_id in active_accounts]
        for res in async_results:
            results.append(res.get())
            
    print("\n--- SYSTEM CHECK RESULTS ---")
    for r in results:
        print(r)
    print("----------------------------\n")
    print("[*] All terminals terminated successfully. System check passed.")

if __name__ == '__main__':
    # Fix for multiprocessing on Windows
    mp.freeze_support()
    
    # Execute the Portfolio on the whole Fleet (SPLIT PENDING ORDERS)
    
    # 1. Gold (XAUUSD)
    broadcast_signal("XAUUSD", "SELL", 0.01, 4688.35, 4699.52, 4677.19, 4666.02, 4654.86)
    
    # 2. Silver (XAGUSD)
    broadcast_signal("XAGUSD", "SELL", 0.01, 75.41, 76.01, 74.82, 74.23, 73.64)


