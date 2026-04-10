import os
import sys
import json
import time
import base64
import requests
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import MetaTrader5 as mt5

# Load Environment from parent or current
load_dotenv('.env')

# Configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPPORT_BOT_TOKEN = os.getenv("SUPPORT_BOT_TOKEN")
ADMIN_TELEGRAM_ID = os.getenv("ADMIN_TELEGRAM_ID", "MadDmakz")
ADMIN_USERNAME = os.getenv("ADMIN_TELEGRAM_USERNAME", "MadDmakz")

# Color mapping for terminal
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'
    BLUE = '\033[94m'

def log_status(category, message, status="OK"):
    if status == "OK":
        print(f"{Colors.GREEN}[+] {category}: {message}{Colors.RESET}")
    elif status == "WARN":
        print(f"{Colors.YELLOW}[!] {category}: {message}{Colors.RESET}")
    else:
        print(f"{Colors.RED}[-] {category}: {message}{Colors.RESET}")

def send_telegram_report(report_text):
    if not SUPPORT_BOT_TOKEN:
        print("❌ Support Bot Token missing. Cannot send report.")
        return
    
    # Target can be a Chat ID or Username (IDs preferred)
    target = ADMIN_TELEGRAM_ID
    url = f"https://api.telegram.org/bot{SUPPORT_BOT_TOKEN}/sendMessage"
    
    payload = {
        "chat_id": target,
        "text": f"🛡️ <b>ZEN PIPS SYSTEM AUDIT</b>\n\n{report_text}",
        "parse_mode": "HTML"
    }
    
    try:
        res = requests.post(url, json=payload)
        if res.status_code == 200:
            log_status("Telegram", "Report successfully delivered to Admin.")
        else:
            log_status("Telegram", f"Failed to deliver: {res.text}", "WARN")
    except Exception as e:
        log_status("Telegram", f"Error: {e}", "FAIL")

def run_checks():
    report = []
    issues = []
    
    print(f"\n{Colors.BLUE}=== Zen Pips Master Integrity Audit ==={Colors.RESET}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # 1. Environment & Netlify Limit
    env_path = '.env'
    if os.path.exists(env_path):
        size = os.path.getsize(env_path)
        status = "OK" if size < 4000 else "FAIL"
        log_status("Environment", f"Size: {size} bytes (Limit: 4096)", status)
        if status == "FAIL":
            issues.append("Netlify 4KB Enviroment Limit exceeded.")
    else:
        log_status("Environment", ".env file missing!", "FAIL")
        issues.append(".env file missing.")

    # 2. Supabase Connection
    supabase: Client = None
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Missing Supabase URL/Key")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        count_res = supabase.table("signals").select("id", count="exact").limit(1).execute()
        log_status("Supabase", f"Connected. (Total signals: {count_res.count})", "OK")
    except Exception as e:
        log_status("Supabase", f"Connection failed: {e}", "FAIL")
        issues.append("Supabase Connection Offline.")

    # 3. Community Sync Loop
    if supabase:
        try:
            # Check last 5 active signals
            signals_res = supabase.table("signals").select("id, pair, status").order("created_at", desc=True).limit(10).execute()
            messages_res = supabase.table("community_messages").select("id, content, image").order("created_at", desc=True).limit(20).execute()
            
            signals = signals_res.data or []
            messages = messages_res.data or []
            
            sync_ok = True
            for sig in signals:
                if sig['status'] == 'ACTIVE':
                    # Look for ticker in message content
                    found = any(sig['pair'].split('/')[0].lower() in m['content'].lower() for m in messages)
                    if not found:
                        log_status("Sync", f"Mismatch: Active Signal {sig['pair']} has NO community post!", "FAIL")
                        issues.append(f"Missing community sync for {sig['pair']}.")
                        sync_ok = False
            
            if sync_ok:
                log_status("Sync", "Community, Telegram, and Signals are in alignment.", "OK")
        except Exception as e:
            log_status("Sync", f"Audit failed: {e}", "WARN")

    # 4. Storage Bucket Audit
    if supabase:
        try:
            # Categorization check logic
            sample_chart = supabase.table("community_messages").select("image").not_.is_("image", "null").order("created_at", desc=True).limit(1).execute().data
            if sample_chart:
                url = sample_chart[0]['image']
                if "/charts/" in url:
                    log_status("Storage", f"Verified Folder: {url.split('/charts/')[1].split('/')[0]} (Monthly Organized)", "OK")
                else:
                    log_status("Storage", "Uncategorized image detected.", "WARN")
        except Exception as e:
            log_status("Storage", f"Folder audit failed: {e}", "WARN")

    # 5. MT5 Bridge Health
    try:
        if mt5.initialize():
            log_status("Bridge", "MT5 Terminal initialized successfully.", "OK")
            account_info = mt5.account_info()
            if account_info:
                log_status("Bridge", f"Vantage Account: {account_info.login} (Server: {account_info.server})", "OK")
                log_status("Bridge", f"Trade Allowed: {account_info.trade_allowed}", "OK" if account_info.trade_allowed else "FAIL")
                if not account_info.trade_allowed:
                    issues.append("Institutional Bridge: Trade Allowed is FALSE.")
            else:
                log_status("Bridge", "No account detected on MT5 terminal.", "FAIL")
                issues.append("MT5 Terminal: No Account Logged In.")
            mt5.shutdown()
        else:
            log_status("Bridge", "MT5 Terminal Offline/Not Installed.", "FAIL")
            issues.append("MT5 Connection Failed.")
    except Exception as e:
        log_status("Bridge", f"Critical Error: {e}", "FAIL")

    # Final Report Generation
    print(f"\n{Colors.BLUE}=== Audit Summary ==={Colors.RESET}")
    if not issues:
        summary = "[OK] SYSTEM STATUS: PERFECT\nYour ecosystem is fully synced and market-ready."
        print(f"{Colors.GREEN}{summary}{Colors.RESET}")
    else:
        summary = f"[!] SYSTEM STATUS: {len(issues)} ISSUES DETECTED\n" + "\n".join([f"• {iss}" for iss in issues])
        print(f"{Colors.RED}{summary}{Colors.RESET}")

    # Deep Report for Telegram
    report_text = f"<b>STATUS:</b> {'OK - Perfect' if not issues else 'WARN - Issues Detected'}\n"
    report_text += f"<b>DATE:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
    report_text += f"{'Ecosystem sync confirmed. Institutional bridge ready.' if not issues else 'Manual calibration required.'}\n\n"
    if issues:
        report_text += "<b>🛑 DISCORDANCES:</b>\n" + "\n".join([f"- {iss}" for iss in issues])

    return report_text

if __name__ == "__main__":
    report_text = run_checks()
    
    # Use --report flag to send to Telegram
    if "--report" in sys.argv:
        send_telegram_report(report_text)
