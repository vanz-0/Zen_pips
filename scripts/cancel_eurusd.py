import MetaTrader5 as mt5
import os

FLEET_ACCOUNTS = {
    "25131567": {"password": "VD7g^2GT", "server": "VantageInternational-Demo"},
    "25131572": {"password": "X03zu@Z5", "server": "VantageInternational-Demo"},
    "25113210": {"password": "!pA@Rj@0", "server": "VantageInternational-Demo"}
}

def cleanup():
    for acc_id, details in FLEET_ACCOUNTS.items():
        if not mt5.initialize(login=int(acc_id), password=details["password"], server=details["server"]):
            print(f"Failed to login to {acc_id}")
            continue

        symbol = "EURUSD"
        suffixes = ["", ".v", "+", "m", "c"]
        for suffix in suffixes:
            sym = f"{symbol}{suffix}"
            orders = mt5.orders_get(symbol=sym)
            if orders:
                for order in orders:
                    request = {
                        "action": mt5.TRADE_ACTION_REMOVE,
                        "order": order.ticket
                    }
                    res = mt5.order_send(request)
                    print(f"[{acc_id}] Cancelled {sym} order {order.ticket}: {res.retcode if res else 'Failed'}")
        mt5.shutdown()

if __name__ == "__main__":
    cleanup()
