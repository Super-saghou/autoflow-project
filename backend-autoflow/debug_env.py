#!/usr/bin/env python3
"""
Debug environment variables loading
"""

import os
from dotenv import load_dotenv

print("🔍 Debugging Environment Variables...")
print("=" * 40)

# Load environment variables
load_dotenv()

print("Environment variables after load_dotenv():")
print(f"SENDER_EMAIL: '{os.getenv('SENDER_EMAIL')}'")
print(f"SENDER_PASSWORD: '{os.getenv('SENDER_PASSWORD')}'")
print(f"SMTP_SERVER: '{os.getenv('SMTP_SERVER')}'")
print(f"SMTP_PORT: '{os.getenv('SMTP_PORT')}'")

# Check if they're empty
if not os.getenv('SENDER_EMAIL'):
    print("❌ SENDER_EMAIL is empty or not loaded")
else:
    print("✅ SENDER_EMAIL is loaded")

if not os.getenv('SENDER_PASSWORD'):
    print("❌ SENDER_PASSWORD is empty or not loaded")
else:
    print("✅ SENDER_PASSWORD is loaded")

# Test direct file reading
print("\n📄 Reading .env file directly:")
try:
    with open('.env', 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                print(f"  {line.strip()}")
except Exception as e:
    print(f"Error reading .env file: {e}") 