#!/usr/bin/env python3
"""Verify papers in Supabase."""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')

r = requests.get(
    f'{url}/rest/v1/papers?select=id,title,ai_score',
    headers={
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
)

papers = r.json()
print(f"✅ Papers in Supabase: {len(papers)} rows\n")
print("=" * 70)

for i, paper in enumerate(papers[:10], 1):
    title = paper.get('title', 'N/A')[:60]
    score = paper.get('ai_score')
    print(f"{i}. {title}")
    print(f"   Score: {score}\n")

if len(papers) > 10:
    print(f"... and {len(papers) - 10} more papers")
