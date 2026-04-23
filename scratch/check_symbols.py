import MetaTrader5 as mt5

if not mt5.initialize():
    print("Initialize failed")
    quit()

symbols = ["GBPUSD", "GBPUSD+", "EURUSD", "EURUSD+", "XAUUSD", "XAUUSD+", "XAGUSD", "XAGUSD+", "BTCUSD", "BTCUSD+"]

for s in symbols:
    info = mt5.symbol_info(s)
    if info:
        print(f"{s}: Trade Mode={info.trade_mode}, Path={info.path}, Visible={info.visible}")
    else:
        print(f"{s}: NOT FOUND")

mt5.shutdown()
