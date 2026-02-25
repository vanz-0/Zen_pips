import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.tmp', 'zenpips.db')

def list_pending():
    if not os.path.exists(DB_PATH):
        print("Database does not exist or has not been initialized yet.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, user_id, username, tier, tx_id, submission_time FROM pending_transactions")
    records = cursor.fetchall()
    
    if not records:
        print("No pending transactions found.")
        return
        
    print(f"{'ID':<5} | {'User ID':<12} | {'Username':<15} | {'Tier':<15} | {'TxID':<25} | {'Time'}")
    print("-" * 100)
    for r in records:
        print(f"{r[0]:<5} | {r[1]:<12} | {r[2]:<15} | {r[3]:<15} | {r[4]:<25} | {r[5]}")
        
    conn.close()

if __name__ == "__main__":
    list_pending()
