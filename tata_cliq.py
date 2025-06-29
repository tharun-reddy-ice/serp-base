import json
import requests
from bs4 import BeautifulSoup

SEARCH_URL = "https://www.tatacliq.com/search/?searchCategory=all&text=pants%20and%20trousers"
DOMAIN     = "https://www.tatacliq.com"
HEADERS    = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/114.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
}

resp = requests.get(SEARCH_URL, headers=HEADERS, timeout=10)
resp.raise_for_status()
soup = BeautifulSoup(resp.text, "lxml")

products = []
for tile in soup.select("div.Grid__element"):
    a = tile.find("a", {"id": lambda x: x and x.startswith("ProductModule-")})
    if not a:
        continue

    pid = a["id"].split("-", 1)[1]
    href = a.get("href", "")
    url = href if href.startswith("http") else DOMAIN + href

    img = tile.select_one("img.Image__actual")
    img_url = None
    if img and img.get("src"):
        img_url = img["src"]
        if img_url.startswith("//"):
            img_url = "https:" + img_url

    brand = tile.select_one("h3.ProductDescription__boldText")
    title = tile.select_one("h2.ProductDescription__description")
    price = tile.select_one("div.ProductDescription__priceHolder h3")
    rating = tile.select_one("div.StarRating__starRatingHigh")
    reviews = tile.select_one("div.ProductInfo__totalNoOfReviews")

    entry = {
        "product_id":   pid,
        "brand":        brand.get_text(strip=True) if brand else None,
        "title":        title.get_text(strip=True) if title else None,
        "price":        price.get_text(strip=True) if price else None,
        "image_url":    img_url,
        "product_url":  url,
        "rating":       float(rating.get_text(strip=True)) if rating else None,
        "review_count": int(reviews.get_text(strip="()")) if reviews else 0,
    }
    products.append(entry)

print(json.dumps(products, indent=2, ensure_ascii=False))
