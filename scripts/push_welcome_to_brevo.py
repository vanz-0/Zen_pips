import os
import requests
from dotenv import load_dotenv

load_dotenv('.env')
BREVO_API_KEY = os.getenv('BREVO_API_KEY')

def push_template():
    if not BREVO_API_KEY:
        print("ERROR: BREVO_API_KEY not found in .env")
        return

    # 1. Load Local Template
    template_path = 'public/emails/welcome.html'
    if not os.path.exists(template_path):
        print(f"ERROR: Local template not found at {template_path}")
        return

    with open(template_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # 2. Update Template ID 2 in Brevo
    url = "https://api.brevo.com/v3/smtp/templates/2"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY
    }
    
    payload = {
        "tag": "institutional_welcome",
        "sender": {"name": "Zenpips Team", "email": "zenithbrainiac@gmail.com"},
        "templateName": "Zen Pips Institutional Welcome (Zero Password)",
        "htmlContent": html_content,
        "subject": "Welcome to Zenpips - Institutional Access Initialized",
        "replyTo": "zenithbrainiac@gmail.com",
        "isActive": True
    }

    print("Step 1: Updating Brevo Template ID: 2...")
    try:
        response = requests.put(url, json=payload, headers=headers)
        
        if response.status_code in [200, 204]:
            print("Step 2: SUCCESS - Brevo Template ID 2 has been updated.")
            print("Action: Clear the cache or check the SX section in Brevo.")
        else:
            print(f"FAILED: Status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    push_template()
