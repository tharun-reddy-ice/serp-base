import requests
from bs4 import BeautifulSoup
import json
import re
import time
import random
from urllib.parse import quote_plus
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FlipkartScraper:
    def __init__(self):
        self.base_url = "https://www.flipkart.com/search?q={search_term}"
        self.session = requests.Session()
        
        # Realistic user agents for rotation
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        ]
        
        # Headers to mimic real browser behavior
        self.headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
        }
    
    def get_random_user_agent(self):
        return random.choice(self.user_agents)
    
    def make_request(self, url, max_retries=3):
        """Make HTTP request with retry logic and random delays"""
        for attempt in range(max_retries):
            try:
                # Update headers with random user agent
                headers = self.headers.copy()
                headers['User-Agent'] = self.get_random_user_agent()
                
                # Random delay between requests
                time.sleep(random.uniform(1, 3))
                
                response = self.session.get(url, headers=headers, timeout=15)
                
                if response.status_code == 200:
                    return response
                elif response.status_code == 429:
                    # Rate limited, wait longer
                    logger.warning(f"Rate limited, waiting before retry {attempt + 1}")
                    time.sleep(random.uniform(5, 10))
                else:
                    logger.warning(f"Status code {response.status_code}, attempt {attempt + 1}")
                    
            except requests.RequestException as e:
                logger.error(f"Request failed: {e}, attempt {attempt + 1}")
                time.sleep(random.uniform(2, 5))
        
        return None
    
    def extract_product_data(self, product_element):
        """Extract data from a single product element"""
        product_data = {
            'name': '',
            'url': '',
            'price': '',
            'original_price': '',
            'discount': '',
            'discount_percentage': '',
            'rating': '',
            'total_ratings': '',
            'total_reviews': '',
            'specifications': [],
            'image_url': '',
            'brand': '',
            'price_numeric': 0,
            'original_price_numeric': 0,
            'savings_amount': 0,
            'is_sponsored': False,
            'delivery_info': '',
            'seller_info': ''
        }
        
        try:
            # Extract product name
            name_selectors = [
                'div.KzDlHZ', 
                'a[title]', 
                '.s1Q9rs',
                '._4rR01T',
                '.IRpwTa'
            ]
            
            for selector in name_selectors:
                name_element = product_element.select_one(selector)
                if name_element:
                    product_data['name'] = name_element.get_text(strip=True)
                    if name_element.get('title'):
                        product_data['name'] = name_element['title']
                    break
            
            # Extract URL
            url_element = product_element.select_one('a[href]')
            if url_element and url_element.get('href'):
                href = url_element['href']
                if href.startswith('/'):
                    product_data['url'] = 'https://www.flipkart.com' + href
                else:
                    product_data['url'] = href
            
            # Extract current price
            price_selectors = [
                '.Nx9bqj._4b5DiR',
                '._30jeq3._1_WHN1',
                '._1_WHN1',
                '.Nx9bqj'
            ]
            
            for selector in price_selectors:
                price_element = product_element.select_one(selector)
                if price_element:
                    product_data['price'] = price_element.get_text(strip=True)
                    break
            
            # Extract original price
            original_price_selectors = [
                '.yRaY8j.ZYYwLA',
                '._3I9_wc._27UcVY',
                '._3I9_wc'
            ]
            
            for selector in original_price_selectors:
                original_price_element = product_element.select_one(selector)
                if original_price_element:
                    product_data['original_price'] = original_price_element.get_text(strip=True)
                    break
            
            # Extract discount percentage
            discount_selectors = [
                '.UkUFwK span',
                '._3Ay6Sb span',
                '.VXRQ7u'
            ]
            
            for selector in discount_selectors:
                discount_element = product_element.select_one(selector)
                if discount_element:
                    product_data['discount'] = discount_element.get_text(strip=True)
                    break
            
            # Extract rating
            rating_selectors = [
                '.XQDdHH',
                '._3LWZlK',
                '.gUuXy-'
            ]
            
            for selector in rating_selectors:
                rating_element = product_element.select_one(selector)
                if rating_element:
                    rating_text = rating_element.get_text(strip=True)
                    rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                    if rating_match:
                        product_data['rating'] = rating_match.group(1)
                    break
            
            # Extract ratings and reviews count
            ratings_reviews_selectors = [
                '.Wphh3N',
                '._2_R_DZ span',
                '._2_R_DZ'
            ]
            
            for selector in ratings_reviews_selectors:
                ratings_reviews_element = product_element.select_one(selector)
                if ratings_reviews_element:
                    ratings_reviews_text = ratings_reviews_element.get_text(strip=True)
                    
                    # Extract number of ratings
                    ratings_match = re.search(r'([\d,]+)\s*[Rr]atings?', ratings_reviews_text)
                    if ratings_match:
                        product_data['total_ratings'] = ratings_match.group(1)
                    
                    # Extract number of reviews
                    reviews_match = re.search(r'([\d,]+)\s*[Rr]eviews?', ratings_reviews_text)
                    if reviews_match:
                        product_data['total_reviews'] = reviews_match.group(1)
                    break
            
            # Extract specifications/features
            spec_selectors = [
                'li.J+igdf',
                '.rgWa7D li',
                '._1xgFaf li',
                '.fMghES li'
            ]
            
            for selector in spec_selectors:
                spec_elements = product_element.select(selector)
                if spec_elements:
                    for spec in spec_elements:
                        spec_text = spec.get_text(strip=True)
                        if spec_text and spec_text not in product_data['specifications']:
                            product_data['specifications'].append(spec_text)
                    break
            
            # Extract image URL
            image_selectors = [
                'img.DByuf4',
                'img._396cs4',
                'img._2r_T1I'
            ]
            
            for selector in image_selectors:
                image_element = product_element.select_one(selector)
                if image_element and image_element.get('src'):
                    product_data['image_url'] = image_element['src']
                    break
            
            # Extract brand from product name
            if product_data['name']:
                brand_match = re.match(r'^([A-Za-z]+)', product_data['name'])
                if brand_match:
                    product_data['brand'] = brand_match.group(1)
            
            # Process price data
            if product_data['price']:
                price_numeric = re.sub(r'[^\d]', '', product_data['price'])
                if price_numeric:
                    product_data['price_numeric'] = int(price_numeric)
            
            if product_data['original_price']:
                original_price_numeric = re.sub(r'[^\d]', '', product_data['original_price'])
                if original_price_numeric:
                    product_data['original_price_numeric'] = int(original_price_numeric)
            
            # Calculate savings
            if product_data['price_numeric'] and product_data['original_price_numeric']:
                product_data['savings_amount'] = product_data['original_price_numeric'] - product_data['price_numeric']
            
            # Check if sponsored
            sponsored_element = product_element.select_one('[data-tkid*="ADVIEW"]')
            product_data['is_sponsored'] = sponsored_element is not None
            
            # Extract delivery info
            delivery_selectors = [
                '._2Tpdn3',
                '.c7cHbR',
                '._2aK_gu'
            ]
            
            for selector in delivery_selectors:
                delivery_element = product_element.select_one(selector)
                if delivery_element:
                    product_data['delivery_info'] = delivery_element.get_text(strip=True)
                    break
        
        except Exception as e:
            logger.error(f"Error extracting product data: {e}")
        
        return product_data
    
    def search_products(self, search_term, max_pages=5):
        """Search for products and extract data"""
        all_products = []
        encoded_search_term = quote_plus(search_term)
        
        for page in range(1, max_pages + 1):
            logger.info(f"Scraping page {page} for '{search_term}'")
            
            # Construct URL with page parameter
            if page == 1:
                url = self.base_url.format(search_term=encoded_search_term)
            else:
                url = f"{self.base_url.format(search_term=encoded_search_term)}&page={page}"
            
            response = self.make_request(url)
            
            if not response:
                logger.error(f"Failed to fetch page {page}")
                continue
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find product containers using multiple selectors
            product_selectors = [
                '[data-id]',
                '._1AtVbE',
                '._13oc-S',
                '.cPHDOP',
                '._75nlfW'
            ]
            
            products_found = []
            for selector in product_selectors:
                products = soup.select(selector)
                if products:
                    products_found = products
                    break
            
            if not products_found:
                logger.warning(f"No products found on page {page}")
                break
            
            logger.info(f"Found {len(products_found)} product containers on page {page}")
            
            for product_element in products_found:
                product_data = self.extract_product_data(product_element)
                
                # Only add products with meaningful data
                if product_data['name'] and (product_data['price'] or product_data['url']):
                    all_products.append(product_data)
            
            # Random delay between pages
            time.sleep(random.uniform(2, 5))
        
        return all_products
    
    def save_to_json(self, data, filename):
        """Save data to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Data saved to {filename}")
            return True
        except Exception as e:
            logger.error(f"Error saving to JSON: {e}")
            return False
    
    def get_search_summary(self, products):
        """Generate summary statistics"""
        if not products:
            return {}
        
        total_products = len(products)
        products_with_price = [p for p in products if p['price_numeric'] > 0]
        
        summary = {
            'total_products': total_products,
            'products_with_price': len(products_with_price),
            'products_with_rating': len([p for p in products if p['rating']]),
            'sponsored_products': len([p for p in products if p['is_sponsored']]),
            'brands_found': list(set([p['brand'] for p in products if p['brand']])),
            'price_range': {}
        }
        
        if products_with_price:
            prices = [p['price_numeric'] for p in products_with_price]
            summary['price_range'] = {
                'min_price': min(prices),
                'max_price': max(prices),
                'avg_price': sum(prices) // len(prices)
            }
        
        return summary

# Function to scrape and return JSON
def scrape_flipkart_products(search_term, max_pages=3):
    """Scrape Flipkart products and return JSON data"""
    scraper = FlipkartScraper()
    
    logger.info(f"Searching for '{search_term}' on Flipkart...")
    products = scraper.search_products(search_term, max_pages=max_pages)
    
    if products:
        # Generate summary
        summary = scraper.get_search_summary(products)
        
        # Prepare final data structure
        result = {
            'search_term': search_term,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_pages_scraped': max_pages,
            'summary': summary,
            'products': products
        }
        
        return result
    else:
        return {
            'search_term': search_term,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_pages_scraped': max_pages,
            'summary': {'total_products': 0},
            'products': [],
            'error': 'No products found'
        }

# Alternative: Direct JSON output function
def get_flipkart_products_json(search_term, max_pages=3):
    """
    Direct function to get Flipkart products as JSON string
    Usage: json_string = get_flipkart_products_json("laptop", 2)
    """
    result = scrape_flipkart_products(search_term, max_pages)
    return json.dumps(result, indent=2, ensure_ascii=False)

# Example usage
def main():
    # Configuration
    search_term = "laptop"  # Change this to your desired search term
    max_pages = 3  # Number of pages to scrape
    
    # Scrape products
    result_json = scrape_flipkart_products(search_term, max_pages)
    
    # Output JSON to console
    print(json.dumps(result_json, indent=2, ensure_ascii=False))
    
    # Also save to file
    filename = f"flipkart_{search_term.replace(' ', '_')}_{int(time.time())}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result_json, f, indent=2, ensure_ascii=False)
    
    print(f"\n\nData also saved to: {filename}", file=sys.stderr)

if __name__ == "__main__":
    import sys
    main()