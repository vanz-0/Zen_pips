import requests
import json
import os

def push_master_guide():
    # Load .env manually
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    os.environ[k] = v

    api_key = os.getenv("BREVO_API_KEY")
    if not api_key:
        print("Error: BREVO_API_KEY not found in environment.")
        return
    
    html_path = 'public/emails/master_guide.html'
    if not os.path.exists(html_path):
        print(f"Error: {html_path} not found.")
        return

    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": api_key
    }

    # Step 1: Try to Update (PUT)
    template_id = 3
    url = f"https://api.brevo.com/v3/smtp/templates/{template_id}"
    
    update_payload = {
        "tag": "InstitutionalMasterGuide",
        "sender": {"name": "Zen Pips Institutional", "email": "zenithbrainiac@gmail.com"},
        "templateName": "Zen Pips: Master Guide & Manual (Institutional)",
        "htmlContent": html_content,
        "subject": "Zen Pips: Your Definitive Institutional Manual & Setup Guide",
        "replyTo": "zenithbrainiac@gmail.com",
        "isActive": True
    }

    print(f"Attempting to UPDATE Template ID {template_id}...")
    response = requests.put(url, json=update_payload, headers=headers)
    
    if response.status_code in [200, 201, 204]:
        print("SUCCESS: Template updated.")
        return

    print(f"Update failed (Status {response.status_code}).")
    
    # Step 2: Try to Create (POST)
    if response.status_code == 404:
        print("Template ID 3 missing. Attempting to CREATE a new template...")
        create_url = "https://api.brevo.com/v3/smtp/templates"
        
        create_payload = {
            "name": "Zen Pips: Master Guide & Manual (Institutional)",
            "htmlContent": html_content,
            "subject": "Zen Pips: Your Definitive Institutional Manual & Setup Guide",
            "sender": {"name": "Zen Pips Institutional", "email": "zenithbrainiac@gmail.com"},
            "isActive": True,
            "replyTo": "zenithbrainiac@gmail.com",
            "tag": "InstitutionalMasterGuide"
        }
        
        print(f"Payload Name: {create_payload['name']}")
        
        resp = requests.post(create_url, json=create_payload, headers=headers)
        if resp.status_code == 201:
            new_id = resp.json().get('id')
            print(f"SUCCESS: New Template created with ID: {new_id}")
        else:
            print(f"CREATION FAILED: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    push_master_guide()
