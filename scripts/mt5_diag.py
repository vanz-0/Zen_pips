"""MT5 Connection Diagnostic — tests every possible connection method."""
import sys
import os

# Check MetaTrader5 package
try:
    import MetaTrader5 as mt5
    print(f"[OK] MetaTrader5 package version: {mt5.__version__}")
    print(f"[OK] Package location: {mt5.__file__}")
except ImportError:
    print("[FAIL] MetaTrader5 package not installed!")
    sys.exit(1)

print(f"[INFO] Python: {sys.version}")
print(f"[INFO] Python executable: {sys.executable}")
print()

# Test 1: Bare initialize (attach to running terminal)
print("=== TEST 1: mt5.initialize() — attach to running terminal ===")
result = mt5.initialize()
if result:
    info = mt5.terminal_info()
    acc = mt5.account_info()
    if info:
        print(f"  [OK] Terminal: {info.name}")
        print(f"  [OK] Path: {info.path}")
        print(f"  [OK] Connected: {info.connected}")
        print(f"  [OK] Trade Allowed: {info.trade_allowed}")
    if acc:
        print(f"  [OK] Account: {acc.login} @ {acc.server}")
        print(f"  [OK] Balance: ${acc.balance:.2f}")
    else:
        print("  [WARN] No account info available")
    mt5.shutdown()
else:
    err = mt5.last_error()
    print(f"  [FAIL] Error: {err}")
    print()

    # Test 2: With explicit path
    print("=== TEST 2: mt5.initialize(path=...) — explicit terminal path ===")
    mt5_path = r"C:\Program Files\Vantage International MT5\terminal64.exe"
    if os.path.exists(mt5_path):
        print(f"  [OK] terminal64.exe exists at: {mt5_path}")
        result2 = mt5.initialize(path=mt5_path)
        if result2:
            acc = mt5.account_info()
            print(f"  [OK] Connected! Account: {acc.login if acc else 'N/A'}")
            mt5.shutdown()
        else:
            print(f"  [FAIL] Error: {mt5.last_error()}")
    else:
        print(f"  [FAIL] terminal64.exe not found at: {mt5_path}")
    print()

    # Test 3: With full login credentials
    print("=== TEST 3: mt5.initialize(login=...) — full credentials ===")
    result3 = mt5.initialize(
        path=mt5_path,
        login=25803510,
        password="!OzRmn6U",
        server="VantageMarkets-Demo"
    )
    if result3:
        acc = mt5.account_info()
        print(f"  [OK] Connected! Account: {acc.login if acc else 'N/A'}")
        mt5.shutdown()
    else:
        print(f"  [FAIL] Error: {mt5.last_error()}")

print()
print("=== DIAGNOSTIC COMPLETE ===")
