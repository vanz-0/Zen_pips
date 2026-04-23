import MetaTrader5 as mt5

if not mt5.initialize():
    print("Failed to initialize")
    quit()

symbols = ["EURUSD+", "GBPUSD+", "EURUSD", "GBPUSD", "XAUUSD+", "XAGUSD", "BTCUSD"]

for s in symbols:
    orders = mt5.orders_get(symbol=s)
    if orders:
        print(f"Cleaning {s}...")
        for o in orders:
            res = mt5.order_send({"action": mt5.TRADE_ACTION_REMOVE, "order": o.ticket})
            if res.retcode == mt5.TRADE_RETCODE_DONE:
                print(f"  Removed {o.ticket}")
            else:
                print(f"  Failed {o.ticket}: {res.comment}")

mt5.shutdown()
