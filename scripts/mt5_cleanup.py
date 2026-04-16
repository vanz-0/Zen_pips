"""
MT5 Cleanup Script
Removes duplicate pending orders, keeping only 3 per symbol (TP1, TP2, TP3).
"""
import MetaTrader5 as mt5
from collections import defaultdict

if not mt5.initialize():
    print(f"[FAIL] MT5 init failed: {mt5.last_error()}")
    exit(1)

print("[OK] MT5 Connected")
account = mt5.account_info()
if account:
    print(f"[*] Account: {account.login} | Server: {account.server}")

# Get all pending orders
orders = mt5.orders_get()
if orders is None or len(orders) == 0:
    print("[*] No pending orders found on terminal.")
    mt5.shutdown()
    exit(0)

print(f"\n[*] Total pending orders found: {len(orders)}")

# Group orders by symbol
by_symbol = defaultdict(list)
for order in orders:
    by_symbol[order.symbol].append(order)

# For each symbol, keep the FIRST 3 orders (oldest), delete the rest
total_removed = 0
total_kept = 0

for symbol, symbol_orders in by_symbol.items():
    # Sort by ticket (ascending = oldest first)
    symbol_orders.sort(key=lambda o: o.ticket)
    
    keep = symbol_orders[:3]
    remove = symbol_orders[3:]
    
    print(f"\n--- {symbol} ---")
    print(f"  Total: {len(symbol_orders)} | Keeping: {len(keep)} | Removing: {len(remove)}")
    
    for order in keep:
        print(f"  [KEEP] Ticket: {order.ticket} | Type: {order.type} | Price: {order.price_open} | SL: {order.sl} | TP: {order.tp} | Comment: {order.comment}")
        total_kept += 1
    
    for order in remove:
        request = {
            "action": mt5.TRADE_ACTION_REMOVE,
            "order": order.ticket,
        }
        result = mt5.order_send(request)
        if result and result.retcode == mt5.TRADE_RETCODE_DONE:
            print(f"  [DELETED] Ticket: {order.ticket}")
            total_removed += 1
        else:
            comment = result.comment if result else "Unknown"
            print(f"  [FAIL] Could not delete ticket {order.ticket}: {comment}")

print(f"\n=== Cleanup Complete ===")
print(f"  Kept: {total_kept} orders")
print(f"  Removed: {total_removed} orders")
print(f"  Remaining on terminal: {total_kept} pending orders")

mt5.shutdown()
