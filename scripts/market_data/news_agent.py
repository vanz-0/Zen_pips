import os
import sys
import glob
import io
import json
import PyPDF2
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv('.env')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not OPENAI_API_KEY:
    print("Error: Missing credentials.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = OpenAI(api_key=OPENAI_API_KEY)

TARGET_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "NZD", "CHF", "JPY"]

PERSONAS = {
    "Zen Master": "The overarching mentor. Focused on patience, high-timeframe liquidity sweeps, and protecting capital.",
    "LiquidityHunter": "Aggressive analyst. Hunts retail stop-losses and expects news spikes into obvious zones.",
    "OrderBlock_OG": "Technical executor. Matches news expectations with FVGs and institutional price delivery.",
    "AlphaScalper": "High-energy ROI focus. Drives FOMO about Pro signals and the $50 Auto-Trader bridge.",
    "CapitalGuardian": "Risk and psychology expert. Focuses on account longevity and best practices for small vs large accounts.",
    "VaultExplorer": "Technical reviewer. Discusses the performance and utility of proprietary tools in the Vault section.",
    "TrendVoyager": "Educational mentor. Focuses on beginners, market session basics, and interactive Q&A."
}

def get_today_news():
    today_str = datetime.utcnow().strftime('%Y-%m-%d')
    res = supabase.table('market_news').select('*').eq('event_date', today_str).in_('currency', TARGET_CURRENCIES).execute()
    return res.data

def get_active_signals():
    res = supabase.table('signals').select('*').eq('closed', False).execute()
    return res.data

def get_historical_context(event_name):
    today_str = datetime.utcnow().strftime('%Y-%m-%d')
    res = supabase.table('market_news').select('*').eq('event_name', event_name).lt('event_date', today_str).order('event_date', desc=True).limit(2).execute()
    return res.data

def extract_zain_brain_knowledge():
    """Extract cached knowledge from the Karpathy Wiki structure (ZAIN Brain 2.0)."""
    wiki_dir = os.path.join(os.getcwd(), 'zain_brain', 'wiki')
    concepts_dir = os.path.join(wiki_dir, 'concepts')
    entities_dir = os.path.join(wiki_dir, 'entities')
    
    knowledge_base = "ZAIN Universal Memory Context:\n"
    
    # Read core concepts and extraction from PDFs
    if os.path.exists(concepts_dir):
        for root, dirs, files in os.walk(concepts_dir):
            for file in files:
                if file.endswith('.md'):
                    try:
                        with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                            knowledge_base += f"--- {file} ---\n{f.read()[:1000]}\n"
                    except: pass

    # Read platform entity details (Bridge, Vault, etc.)
    if os.path.exists(entities_dir):
        for file in glob.glob(os.path.join(entities_dir, '*.md')):
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    knowledge_base += f"--- {os.path.basename(file)} ---\n{f.read()}\n"
            except: pass
            
    return knowledge_base[:8000]

def generate_multi_agent_discussion(news_data, signals, smc_context):
    if not news_data:
        return []

    news_summary = ", ".join([f"{n['currency']} {n['event_name']} at {n['event_time']}" for n in news_data])
    signals_summary = ", ".join([f"{s['pair']} {s['direction']}" for s in signals]) if signals else "None"

    # Define the "Rotating Task" for this batch
    tasks = [
        "EDUCATIONAL ADVICE: Discussing best practices for account sizes and small-account growth.",
        "TOOL REVIEW: Reviewing the performance of a specific tool in the Vault (e.g. Bridge or AI analysis).",
        "GROWTH & ROI: FOMO-driven discussion about the $50 Pro Auto-Trader and $10/1000 credit value.",
        "Q&A SESSION: One agent asking a common community question, others providing institutional answers."
    ]
    import random
    current_task = random.choice(tasks)

    prompt = f"""
    You are orchestrating a realistic, high-value institutional chat discussion between 3 to 4 agents from our roster:
    {json.dumps(PERSONAS, indent=2)}
    
    Context:
    - News: {news_summary}
    - Signals: {signals_summary}
    - RAG Knowledge: {smc_context[:4000]}
    
    ROTATING TASK FOR THIS DISCUSSION: {current_task}

    STRICT CONSTRAINTS:
    1. Educational FOMO: The tone must be expert, slightly mysterious (institutional edge), but highly encouraging about using Zen Pips features.
    2. Pricing Logic: Mentions of $250 for 6-mo or $10 for 1k credits must be woven in naturally during Growth/ROI tasks.
    3. Alternating: Agents must reply to each other. Agent A starts, B counters or supports, C adds the institutional weight.
    4. Format: Return ONLY a JSON array of objects with "persona" and "message". No markdown blocks.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a senior community coordinator for an elite trading house. Output pure JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"): content = content[7:-3]
        return json.loads(content)
    except Exception as e:
        print(f"Agent error: {e}")
        return []

def inject_to_community(chat_log):
    if not chat_log:
        return
    
    # Check if we already posted a morning briefing today to prevent duplicates
    today_str = datetime.utcnow().strftime('%Y-%m-%d')
    res = supabase.table('community_messages').select('id').eq('channel', 'market-news').gte('created_at', today_str).execute()
    if len(res.data) > 0:
        print("Morning briefing already injected today. Skipping.")
        return

    print("Injecting multi-agent discussion...")
    
    for entry in chat_log:
        persona = entry.get('persona', 'Zen Master')
        message = entry.get('message', '')
        
        # Insert raw. The frontend will style based on persona mapping.
        supabase.table("community_messages").insert({
            "content": f"**{persona}**: {message}",
            "channel": "market-news"
        }).execute()
        
    print(f"✅ Successfully injected {len(chat_log)} synchronized messages into #market-news.")

if __name__ == "__main__":
    print("Initiating Institutional News Agent...")
    news = get_today_news()
    if news:
        print(f"Found {len(news)} high/medium impact events for today.")
        active_sigs = get_active_signals()
        print("Querying ZAIN Obsidian Brain...")
        smc_text = extract_zain_brain_knowledge()
        print("Generating Multi-Persona Discussion...")
        chat_transcript = generate_multi_agent_discussion(news, active_sigs, smc_text)
        inject_to_community(chat_transcript)
    else:
        print("No major news events impacting our core pairs today. System holding equilibrium.")
