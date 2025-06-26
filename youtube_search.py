#!/usr/bin/env python3
import argparse
import json
from datetime import datetime
from yt_dlp import YoutubeDL

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
            "youtube_url":      entry.get("webpage_url"),
            "video_id":         entry.get("id"),
            "upload_date":      entry.get("upload_date"),        # YYYYMMDD
            "like_count":       entry.get("like_count"),
            "dislike_count":    entry.get("dislike_count"),
            "duration":         entry.get("duration"),           # seconds
            "added_date":       now_iso,                         # script run time
            "creator_name":     entry.get("uploader"),
            "description":      entry.get("description"),
        })
    return results

# Standardized function for backend integration
def scrape_youtube_data(search_term, max_results=20):
    """Search YouTube and return standardized JSON data"""
    import time
    
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
            'products': videos,  # Using 'products' for consistency with other scrapers
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
    p = argparse.ArgumentParser(
        description="Search YouTube with yt-dlp and output selected metadata as JSON"
    )
    p.add_argument('query', help='Search term')
    p.add_argument('--max-results', type=int, default=50,
                   help='How many videos to fetch')
    p.add_argument('--output', default='filtered_results.json',
                   help='Path to output JSON')
    args = p.parse_args()

    filtered = search_and_filter(args.query, args.max_results)
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(filtered, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(filtered)} items to {args.output}")