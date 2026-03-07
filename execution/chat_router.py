import os
import sys
from supabase import create_client, Client
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not OPENAI_API_KEY:
    print("❌ Critical parameters missing in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = OpenAI(api_key=OPENAI_API_KEY)

def route_question(query):
    """
    Lightweight LLM call to classify intent. Saves tokens by preventing
    the similarity search from scanning unrelated documents.
    """
    system_prompt = """
    You are an intelligent router for the Zen Pips institutional knowledge base.
    Classify the user's query into exactly ONE of five precise categories:
    
    - 'sop': Questions about Zen Pips business, pricing, VIP group access, Telegram bot, rules for taking signals, subscriptions, and our operations.
    - 'market_structure': Questions about BOS, CHoCH, market trends, highs/lows, and basic price action structure.
    - 'liquidity_concepts': Questions about liquidity sweeps, BSL/SSL, Fair Value Gaps (FVG), Order Blocks (OB), and Inducements.
    - 'trading_strategies': Questions about the AMD cycle, specific entry models, execution playbooks, and overall SMC/ICT strategy.
    - 'psychology_mindset': Questions about trading discipline, emotion control, and general risk management philosophy.
    
    Respond with ONLY the exact category string. No quotes or punctuation.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", # Fast and cheap for routing
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            max_tokens=10,
            temperature=0
        )
        category = response.choices[0].message.content.strip().lower()
        valid_cats = ['sop', 'market_structure', 'liquidity_concepts', 'trading_strategies', 'psychology_mindset']
        if category not in valid_cats:
            category = 'trading_strategies' # fallback to main knowledge
        return category
    except Exception as e:
        print(f"Routing error: {e}")
        return 'trading_strategies'

def search_documents(query, limit=4):
    """
    Embeds the user query and searches the appropriate supabase pgvector index.
    """
    category = route_question(query)
    print(f"[*] Intelligent Routing -> Category: [{category.upper()}]")
    
    res = client.embeddings.create(input=[query], model="text-embedding-3-small")
    query_embedding = res.data[0].embedding
    
    # RPC call to our custom Postgres function
    response = supabase.rpc("match_documents", {
        "query_embedding": query_embedding,
        "match_count": limit,
        "filter_category": category
    }).execute()
    
    return response.data, category

def generate_answer(query):
    """
    Retrieves context and passes to the main LLM to generate the final response
    in the Zen Pips tone.
    """
    docs, category = search_documents(query)
    
    if not docs:
        return "I don't have enough institutional data on that topic. Please ask an admin."
        
    context = ""
    for idx, doc in enumerate(docs):
        source = doc.get("metadata", {}).get("source", "Unknown")
        page = doc.get("metadata", {}).get("page", "")
        page_str = f" Page {page}" if page else ""
        context += f"\n--- Source: {source}{page_str} ---\n{doc['content']}\n"
    
    system_prompt = f"""
    You are the Zen Pips Institutional Assistant.
    Answer the user's question using ONLY the provided context below.
    If the context does not contain the answer, say "I don't have enough institutional data to answer that. Please ask an admin."
    
    Your Tone DNA:
    - Bloomberg terminal feel. 
    - Cold, precise, declarative, authoritative. 
    - No fluff. No hype. No "I think maybe". 
    - Say what the facts are. 
    - Use SMC/ICT terminology naturally if relevant and if it exists in the context.
    
    CONTEXT DATA:
    {context}
    """
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ],
        max_tokens=500
    )
    
    return response.choices[0].message.content

if __name__ == "__main__":
    if len(sys.argv) > 1:
        user_query = " ".join(sys.argv[1:])
        print(f"\nUser Query: {user_query}")
        print("-" * 50)
        answer = generate_answer(user_query)
        print(f"\nZen Assistant:\n{answer}\n")
    else:
        print("Usage: python chat_router.py [your question here]")
        print("Example: python chat_router.py What is an order block?")
