#!/usr/bin/env python3
"""Push Horizon items to Supabase via REST API."""

import os
import json
import glob
import requests
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()


def get_latest_items_file():
    """Find the most recent JSON items file from Horizon."""
    summaries_dir = Path(__file__).parent / "data" / "summaries"
    # Find files like: horizon-2026-01-15-en.json
    files = sorted(glob.glob(str(summaries_dir / "horizon-*.json")))
    return files[-1] if files else None


def load_items(filepath):
    """Load items from JSON file."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def push_item_to_supabase(item, supabase_url, supabase_key):
    """Push single item to Supabase papers table."""
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    row = {
        "title": item.get("title"),
        "authors": item.get("author"),
        "abstract": None,  # Horizon doesn't provide abstract by default
        "url": item.get("url"),
        "source": item.get("source"),
        "ai_score": item.get("ai_score"),
        "ai_summary_vi": item.get("ai_summary"),
        "published_at": item.get("published_at"),
    }

    # Validate required fields
    if not row["title"] or not row["url"]:
        return False, "Missing title or url"

    try:
        response = requests.post(
            f"{supabase_url}/rest/v1/papers",
            headers=headers,
            json=row,
            timeout=30,
        )
        response.raise_for_status()
        return True, None
    except Exception as e:
        return False, str(e)


def main():
    """Main push workflow."""
    # Load environment
    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        return

    # Find latest items file
    items_file = get_latest_items_file()
    if not items_file:
        print("❌ No Horizon items JSON file found in data/summaries/")
        return

    print(f"📂 Reading items from: {items_file}")

    # Load items
    try:
        items = load_items(items_file)
    except Exception as e:
        print(f"❌ Failed to load items: {e}")
        return

    if not items:
        print("❌ No items in JSON file")
        return

    print(f"📥 Loaded {len(items)} items from Horizon\n")

    # Push each item
    ok_count = 0
    fail_count = 0

    for i, item in enumerate(items, 1):
        success, error = push_item_to_supabase(item, supabase_url, supabase_key)
        if success:
            ok_count += 1
            status = "✅"
        else:
            fail_count += 1
            status = "❌"

        title = item.get("title", "Untitled")[:60]
        print(f"{status} [{i}/{len(items)}] {title}")
        if error:
            print(f"     Error: {error}")

    # Summary
    print(f"\n{'='*60}")
    print(f"📊 Push Summary:")
    print(f"   ✅ Pushed: {ok_count}/{len(items)}")
    print(f"   ❌ Failed: {fail_count}/{len(items)}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
