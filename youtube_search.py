#!/usr/bin/env python3
import json
import time
from datetime import datetime
from yt_dlp import YoutubeDL

# 🎯 Change this list to include your search terms
SEARCH_TERMS = [
    "Alan Turing",
    "Open source AI tools",
    "GPT-4 applications"
]

MAX_RESULTS = 10  # Number of videos per search
OUTPUT_PATH = "hardcoded_youtube_results.json"  # Output file

def search_and_filter(query: str, max_results: int):
    ydl_opts = {
        'ignoreerrors': True,
        'skip_download': True,
        'quiet': True,
    }
    with YoutubeDL(ydl_opts) as ydl:
        data = ydl.extract_info(f"ytsearch{max_results}:{query}", download=False)
    results = []
    now_iso = datetime.utcnow().isoformat() + "Z"
    for entry in data.get('entries', []):
        if not entry:
            continue
        results.append({
            "youtube_url":   entry.get("webpage_url"),
            "video_id":      entry.get("id"),
            "upload_date":   entry.get("upload_date"),
            "like_count":    entry.get("like_count"),
            "dislike_count": entry.get("dislike_count"),
            "duration":      entry.get("duration"),
            "added_date":    now_iso,
            "creator_name":  entry.get("uploader"),
            "description":   entry.get("description"),
        })
    return results

def scrape_youtube_data(search_term, max_results=20):
    try:
        videos = search_and_filter(search_term, max_results)
        summary = {
            'total_products': len(videos),
            'videos_with_likes': len([v for v in videos if v.get('like_count', 0) > 0]),
            'total_duration': sum([v.get('duration', 0) for v in videos if v.get('duration')]),
            'unique_creators': len(set([v.get('creator_name') for v in videos if v.get('creator_name')]))
        }
        return {
            'search_term': search_term,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_results': len(videos),
            'summary': summary,
            'products': videos,
            'source': 'youtube'
        }
    except Exception as e:
        return {
            'search_term': search_term,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_results': 0,
            'summary': {'total_products': 0},
            'products': [],
            'error': str(e),
            'source': 'youtube'
        }

if __name__ == "__main__":
    all_results = []
    for term in SEARCH_TERMS:
        print(f"Searching: {term}")
        result = scrape_youtube_data(term, MAX_RESULTS)
        all_results.append(result)

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved {len(all_results)} search results to {OUTPUT_PATH}")