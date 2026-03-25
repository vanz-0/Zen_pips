import os
import sys
import asyncio
import modal
from dotenv import load_dotenv

# Load environment to grab the secrets securely
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Define the Modal application
app = modal.App("zenpips-signal-monitor")

# Install the necessary pip packages on the Modal container
monitor_image = modal.Image.debian_slim().pip_install(
    "python-telegram-bot", 
    "requests", 
    "python-dotenv", 
    "pytz"
)

# Upload the execution directory so monitor_signals.py is available
execution_mount = modal.Mount.from_local_dir(
    os.path.dirname(__file__), 
    remote_path="/root/execution"
)

# We define a scheduled interval to check every 5 minutes
@app.function(
    image=monitor_image,
    schedule=modal.Cron("0 */4 * * *"),
    mounts=[execution_mount],
    secrets=[
        modal.Secret.from_dict({
            "TELEGRAM_BOT_TOKEN": os.getenv("TELEGRAM_BOT_TOKEN", ""),
            "FREE_GROUP_ID": os.getenv("FREE_GROUP_ID", ""),
            "ZENPIPS_CHANNEL_ID": os.getenv("ZENPIPS_CHANNEL_ID", ""),
            "NEXT_PUBLIC_SUPABASE_URL": os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""),
            "SUPABASE_SERVICE_ROLE_KEY": os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
            "TWELVE_DATA_API_KEY": os.getenv("TWELVE_DATA_API_KEY", "")
        })
    ]
)
def run_monitor():
    """
    This function runs precisely every 5 minutes on Modal's cloud servers.
    It imports your existing monitor_signals.py check logic and executes the sweep.
    """
    sys.path.append("/root")
    print("🚀 Triggering Zen Pips Cloud Monitor Sweep...")
    
    from execution.monitor_signals import check_all_signals
    
    # Run the async sweep exactly as if it were local
    asyncio.run(check_all_signals())
    print("✅ Sweep complete.")

# You can run `modal deploy execution/modal_monitor.py` to publish this schedule permanently.
