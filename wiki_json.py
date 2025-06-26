import requests

def wikipedia_search(term):
    url = "https://en.wikipedia.org/w/api.php"
    
    params = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": term,
        "utf8": 1
    }

    response = requests.get(url, params=params)
    data = response.json()

    if data.get("query") and data["query"]["search"]:
        first_result = data["query"]["search"][0]
        title = first_result['title']
        page_id = first_result['pageid']
        snippet = first_result['snippet']
        full_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"

        return {
            "title": title,
            "page_id": page_id,
            "url": full_url,
            "snippet": snippet
        }

    return {"error": "No results found"}

# Standardized function for backend integration
def scrape_wikipedia_data(search_term, max_results=10):
    """Search Wikipedia and return standardized JSON data"""
    import time
    
    try:
        result = wikipedia_search(search_term)
        
        if 'error' not in result:
            # Format as a single result in a list for consistency
            products = [result]
            summary = {
                'total_products': 1,
                'search_term': search_term,
                'source': 'wikipedia'
            }
        else:
            products = []
            summary = {'total_products': 0}
        
        return {
            'search_term': search_term,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_results': len(products),
            'summary': summary,
            'products': products,
            'source': 'wikipedia'
        }
    except Exception as e:
        return {
            'search_term': search_term,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_results': 0,
            'summary': {'total_products': 0},
            'products': [],
            'error': str(e),
            'source': 'wikipedia'
        }

# Example usage
if __name__ == "__main__":
    result = wikipedia_search("Alan Turing")
    print(result)