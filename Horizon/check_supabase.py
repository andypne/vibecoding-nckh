#!/usr/bin/env python3
"""Check existing data in Supabase papers table."""

import requests
import os

supabase_url = "https://qpqbkaidvsmmekgimkez.supabase.co"
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_key:
    print("❌ SUPABASE_SERVICE_ROLE_KEY not set")
    exit(1)

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
}

print("📊 Checking Supabase papers table...")

try:
    # Get all papers
    response = requests.get(
        f"{supabase_url}/rest/v1/papers?select=id,title,url",
        headers=headers,
        timeout=10
    )
    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Total rows: {len(data)}")

        if len(data) > 0:
            print("\nFirst 5 rows:")
            for i, row in enumerate(data[:5], 1):
                title = row.get("title", "N/A")[:60]
                print(f"  {i}. {title}")
                print(f"     URL: {row.get('url', 'N/A')[:50]}")
        else:
            print("✅ Table is empty (ready for new data)")
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Response: {response.text[:200]}")

except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
