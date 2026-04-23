import MetaTrader5 as mt5

if not mt5.initialize():
    quit()

symbols = ["EURUSD+", "GBPUSD+", "XAUUSD+", "XAGUSD", "BTCUSD"]

for s in symbols:
    # 1. Orders
    orders = mt5.orders_get(symbol=s)
    if orders:
        for o in orders:
            mt5.order_send({"action": mt5.TRADE_ACTION_REMOVE, "order": o.ticket})
    
    # 2. Positions
    positions = mt5.positions_get(symbol=s)
    if positions:
        print(f"Closing positions for {s}...")
        for p in positions:
            type_close = mt5.ORDER_TYPE_SELL if p.type == mt5.POSITION_TYPE_BUY else mt5.ORDER_TYPE_BUY
            price_close = mt5.symbol_info_tick(s).bid if p.type == mt5.POSITION_TYPE_BUY else mt5.symbol_info_tick(s).ask
            mt5.order_send({
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": s,
                "volume": p.volume,
                "type": type_close,
                "position": p.ticket,
                "price": price_close,
                "type_filling": mt5.ORDER_FILLING_IOC,
            })

mt5.shutdown()
