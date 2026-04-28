"""
Zen Pips Forex Factory News Fetcher
Pulls High & Medium impact events from the Forex Factory XML feed
and posts a formatted digest to the #market-news community channel.
"""
import os
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from collections import defaultdict
import requests
from supabase import create_client

# Fix encoding on Windows console
sys.stdout.reconfigure(encoding='utf-8')

base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_path, '.env')

from dotenv import load_dotenv
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
FF_FEED_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.xml"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_events():
    """Fetch and parse the Forex Factory XML feed."""
    resp = requests.get(FF_FEED_URL, timeout=15)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)

    events = []
    for ev in root.findall("event"):
        impact = (ev.findtext("impact") or "").strip()
        if impact not in ("High", "Medium"):
            continue

        events.append({
            "title": (ev.findtext("title") or "").strip(),
            "country": (ev.findtext("country") or "").strip(),
            "date": (ev.findtext("date") or "").strip(),
            "time": (ev.findtext("time") or "").strip(),
            "impact": impact,
            "forecast": (ev.findtext("forecast") or "").strip(),
            "previous": (ev.findtext("previous") or "").strip(),
        })

    return events


def build_digest(events):
    """Build a Markdown-formatted news digest grouped by date."""
    by_date = defaultdict(list)
    for ev in events:
        by_date[ev["date"]].append(ev)

    impact_icon = {"High": "🔴", "Medium": "🟡"}

    lines = [
        "📰 **ZEN PIPS INSTITUTIONAL NEWS BRIEF**",
        f"📅 Week of {datetime.now().strftime('%B %d, %Y')}",
        "",
        "High & Medium Impact Events — sourced from Forex Factory.",
        "",
    ]

    for date_str in sorted(by_date.keys()):
        try:
            dt = datetime.strptime(date_str, "%m-%d-%Y")
            nice_date = dt.strftime("%A, %b %d")
        except ValueError:
            nice_date = date_str

        lines.append(f"**━━━ {nice_date} ━━━**")

        for ev in by_date[date_str]:
            icon = impact_icon.get(ev["impact"], "⚪")
            forecast_part = f" | Fcst: {ev['forecast']}" if ev["forecast"] else ""
            prev_part = f" | Prev: {ev['previous']}" if ev["previous"] else ""
            lines.append(
                f"{icon} **{ev['time']}** — {ev['country']} {ev['title']}{forecast_part}{prev_part}"
            )

        lines.append("")

    lines.append("⚠️ *Risk Protocol: Reduce exposure 30 min before 🔴 events. Move SL to entry on active positions.*")
    lines.append("")
    lines.append("*Powered by Zen Pips Autonomous News Engine*")

    return "\n".join(lines)


def post_to_community(content):
    """Insert the digest into the community_messages table."""
    result = supabase.table("community_messages").insert({
        "content": content,
        "channel": "market-news",
        "user_id": "00000000-0000-0000-0000-000000000000",
    }).execute()
    return result


if __name__ == "__main__":
    print("[*] Fetching Forex Factory calendar...")
    events = fetch_events()
    print(f"[OK] Found {len(events)} High/Medium impact events this week.")

    digest = build_digest(events)
    print("\n--- PREVIEW ---")
    print(digest)
    print("--- END PREVIEW ---\n")

    print("[*] Posting to #market-news...")
    post_to_community(digest)
    print("[OK] News digest posted successfully!")
