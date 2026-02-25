import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.tmp', 'zenpips.db')

def setup_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Users table covers active members and their expiry dates
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            subscription_tier TEXT,
            expiry_date TIMESTAMP,
            status TEXT DEFAULT 'active'
        )
    ''')

    # Pending transactions table for users waiting for manual approval
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pending_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            tier TEXT,
            tx_id TEXT,
            submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()
    print(f"Database successfully initialized at {DB_PATH}")

if __name__ == "__main__":
    setup_database()
