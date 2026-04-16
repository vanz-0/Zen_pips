import os
import sys
import time
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client
import MetaTrader5 as mt5

load_dotenv('.env')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPPORT_BOT_TOKEN = os.getenv("SUPPORT_BOT_TOKEN")
ADMIN_TELEGRAM_ID = os.getenv("ADMIN_TELEGRAM_ID")

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
    if not SUPPORT_BOT_TOKEN or not ADMIN_TELEGRAM_ID:
        print(f"{Colors.YELLOW}[!] Telegram: Missing bot token or admin ID. Cannot broadcast.{Colors.RESET}")
        return
    
    url = f"https://api.telegram.org/bot{SUPPORT_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": ADMIN_TELEGRAM_ID,
        "text": f"🛡️ <b>SYSTEM AUDIT (GOD SCRIPT)</b>\n\n{report_text}",
        "parse_mode": "HTML"
    }
    try:
        res = requests.post(url, json=payload)
        if res.status_code == 200:
            log_status("Telegram", "Audit report successfully delivered to Admin.")
        else:
            log_status("Telegram", f"Failed to deliver: {res.text}", "WARN")
    except Exception as e:
        log_status("Telegram", f"Error: {e}", "FAIL")

def run_checks():
    issues = []
    
    print(f"\n{Colors.BLUE}=== Autonomous Verification Engine (God Script) ==={Colors.RESET}")
    print(f"Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n")

    # 1. MT5 Execution Bridge
    try:
        if mt5.initialize():
            account_info = mt5.account_info()
            if account_info:
                log_status("MT5 Bridge", f"Connected | Server: {account_info.server} | Login: {account_info.login}", "OK")
                
                if account_info.trade_allowed:
                    log_status("MT5 Permissions", "Trade Allowed is ENABLED.", "OK")
                else:
                    log_status("MT5 Permissions", "Trade Allowed is FALSE. Algo Trading might be off.", "FAIL")
                    issues.append("MT5 Bridge: Trade Allowed is FALSE (Algo disabled).")
            else:
                log_status("MT5 Bridge", "No account logged into local terminal.", "FAIL")
                issues.append("MT5 Bridge: No active account.")
            mt5.shutdown()
        else:
            log_status("MT5 Bridge", "Terminal disconnected or not installed.", "FAIL")
            issues.append("MT5 Bridge: Offline.")
    except Exception as e:
        log_status("MT5 Bridge", f"Critical Error: {e}", "FAIL")
        issues.append(f"MT5 Exception: {e}")

    # 2. Database & Signal Distribution
    supabase: Client = None
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Missing Supabase URL/Key config.")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        log_status("Supabase Web Sync", "Connected successfully.", "OK")

        active_res = supabase.table("signals").select("*").eq("status", "ACTIVE").execute()
        active_signals = active_res.data or []
        log_status("Signal Bridge", f"Found {len(active_signals)} ACTIVE institutional setup(s).", "OK")

        # 3. TV Agent & Community Broadcast Audits
        messages_res = supabase.table("community_messages").select("content").order("created_at", desc=True).limit(50).execute()
        chat_content = " ".join([m['content'].lower() for m in (messages_res.data or [])])

        now = datetime.now(timezone.utc)

        for sig in active_signals:
            pair_code = sig['pair'].split('/')[0].lower() # e.g. 'btc' from 'BTC/USD'
            
            # Community broadcast check
            if pair_code not in chat_content:
                log_status("Community sync", f"Missing broadcast for {sig['pair']}", "WARN")
                issues.append(f"Broadcast Mismatch: {sig['pair']} was not posted to community.")
            else:
                log_status("Community sync", f"Verified broadcast for {sig['pair']}.", "OK")
            
            # TV Agent Monitoring Audit (Sentinel check)
            # Assuming TV Agent updates `check_interval_minutes` or `confluence` or `last_checked` when it runs
            # We look at `last_checked` or if TV agent updated recently. Since TV agent updates signals dynamically...
            last_checked = sig.get('last_checked')
            if last_checked:
                # Convert string to aware datetime
                try:
                    last_checked_dt = datetime.fromisoformat(last_checked.replace('Z', '+00:00'))
                    diff_mins = (now - last_checked_dt).total_seconds() / 60
                    if diff_mins <= 15:
                        log_status("TV Sentinel", f"Autonomous monitoring intact for {sig['pair']} (Updated {int(diff_mins)}m ago).", "OK")
                    else:
                        log_status("TV Sentinel", f"Monitoring STALE for {sig['pair']} (No check in {int(diff_mins)}m).", "WARN")
                        issues.append(f"TV Agent Offline: {sig['pair']} hasn't been checked in {int(diff_mins)} mins.")
                except:
                    pass
            else:
                log_status("TV Sentinel", f"No timestamp found for {sig['pair']} - Might not be monitored.", "WARN")

    except Exception as e:
        log_status("Supabase System", f"Audit failed: {e}", "FAIL")
        issues.append(f"Database Exception: {e}")

    # 4. Background Automations (Sentiment)
    if supabase:
        try:
            sentiment_res = supabase.table("market_sentiment").select("*").order("updated_at", desc=True).limit(1).execute()
            if sentiment_res.data:
                log_status("Sentiment Engine", "Reddit intelligence is populated and active.", "OK")
            else:
                log_status("Sentiment Engine", "No sentiment data found. Cron missing.", "WARN")
                issues.append("Sentiment Engine Offline (No Data).")
        except Exception as e:
            log_status("Sentiment Engine", f"Warning: {e}", "WARN")

    # ENV Limit
    env_size = os.path.getsize('.env') if os.path.exists('.env') else 0
    if env_size > 0 and env_size < 4000:
        log_status("Netlify Sync", ".env payload size is within bounds.", "OK")
    else:
        issues.append("Netlify configuration (.env) missing or exceeds 4KB limit.")

    # Summarize Output
    print(f"\n{Colors.BLUE}=== Full Sector Report ==={Colors.RESET}")
    if not issues:
        report_text = "[OK] ALL AUTONOMOUS SYSTEMS HEALTHY.\nThe TV Agent, MT5 Bridge, and Signal Pipelines are perfectly synced."
        print(f"{Colors.GREEN}{report_text}{Colors.RESET}")
    else:
        report_text = f"[!] SYSTEM STATUS: {len(issues)} ISSUE(s) DETECTED\n" + "\n".join([f"• {iss}" for iss in issues])
        print(f"{Colors.RED}{report_text}{Colors.RESET}")

    html_report = f"<b>STATUS:</b> {'✅ Perfect' if not issues else '🚨 Issues Detected'}\n\n"
    html_report += f"<b>TIME:</b> {datetime.now(timezone.utc).strftime('%H:%M UTC')}\n\n"
    if issues:
        html_report += "<b>ERRORS:</b>\n" + "\n".join([f"- {iss}" for iss in issues])
    else:
        html_report += "Your Institutional Ecosystem is fully monitored by the TV Sentinel and MT5 node."

    return html_report

if __name__ == "__main__":
    report = run_checks()
    if "--report" in sys.argv:
        send_telegram_report(report)
