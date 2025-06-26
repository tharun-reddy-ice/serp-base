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

class AmazonScraper:
    def __init__(self):
        self.base_url = "https://www.amazon.in/s?k={search_term}"
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
                time.sleep(random.uniform(2, 5))
                
                response = self.session.get(url, headers=headers, timeout=15)
                
                if response.status_code == 200:
                    return response
                elif response.status_code == 503:
                    # Service unavailable, wait longer
                    logger.warning(f"Service unavailable, waiting before retry {attempt + 1}")
                    time.sleep(random.uniform(10, 20))
                elif response.status_code == 429:
                    # Rate limited
                    logger.warning(f"Rate limited, waiting before retry {attempt + 1}")
                    time.sleep(random.uniform(15, 30))
                else:
                    logger.warning(f"Status code {response.status_code}, attempt {attempt + 1}")
                    
            except requests.RequestException as e:
                logger.error(f"Request failed: {e}, attempt {attempt + 1}")
                time.sleep(random.uniform(5, 10))
        
        return None
    
    def extract_product_data(self, product_element):
        """Extract data from a single Amazon product element"""
        product_data = {
            'name': '',
            'url': '',
            'price': '',
            'original_price': '',
            'discount_percentage': '',
            'savings_amount': 0,
            'rating': '',
            'total_ratings': '',
            'total_reviews': '',
            'image_url': '',
            'brand': '',
            'price_numeric': 0,
            'original_price_numeric': 0,
            'is_sponsored': False,
            'is_prime': False,
            'free_delivery_date': '',
            'fastest_delivery_date': '',
            'service_info': '',
            'deal_info': '',
            'bought_last_month': '',
            'asin': '',
            'availability_info': ''
        }
        
        try:
            # Extract ASIN
            asin_element = product_element.get('data-asin')
            if asin_element:
                product_data['asin'] = asin_element
            
            # Extract product name
            name_selectors = [
                'h2 a span',
                'h2 span',
                '.s-size-mini a span',
                '[data-cy="title-recipe"] h2 span',
                '.a-link-normal .a-text-normal span'
            ]
            
            for selector in name_selectors:
                name_element = product_element.select_one(selector)
                if name_element:
                    product_data['name'] = name_element.get_text(strip=True)
                    break
            
            # Extract URL
            url_selectors = [
                'h2 a[href]',
                '.s-link-style[href]',
                '[data-cy="title-recipe"] a[href]'
            ]
            
            for selector in url_selectors:
                url_element = product_element.select_one(selector)
                if url_element and url_element.get('href'):
                    href = url_element['href']
                    if href.startswith('/'):
                        product_data['url'] = 'https://www.amazon.in' + href
                    else:
                        product_data['url'] = href
                    break
            
            # Extract current price
            price_selectors = [
                '.a-price-whole',
                '.a-price .a-offscreen',
                '[data-cy="price-recipe"] .a-price .a-offscreen',
                '.a-price-range .a-price .a-offscreen'
            ]
            
            for selector in price_selectors:
                price_element = product_element.select_one(selector)
                if price_element:
                    price_text = price_element.get_text(strip=True)
                    if '₹' in price_text or price_text.replace(',', '').replace('.', '').isdigit():
                        product_data['price'] = price_text
                        break
            
            # Extract original price (MRP)
            original_price_selectors = [
                '.a-price.a-text-price .a-offscreen',
                '[data-a-strike="true"] .a-offscreen',
                '.a-text-price .a-offscreen'
            ]
            
            for selector in original_price_selectors:
                original_price_element = product_element.select_one(selector)
                if original_price_element:
                    original_price_text = original_price_element.get_text(strip=True)
                    if '₹' in original_price_text:
                        product_data['original_price'] = original_price_text
                        break
            
            # Extract discount percentage
            discount_text = product_element.get_text()
            discount_match = re.search(r'\((\d+)%\s*off\)', discount_text)
            if discount_match:
                product_data['discount_percentage'] = discount_match.group(1) + '% off'
            
            # Extract rating
            rating_selectors = [
                '.a-icon-alt',
                '[data-cy="reviews-ratings-slot"] .a-icon-alt',
                '.a-star-small .a-icon-alt'
            ]
            
            for selector in rating_selectors:
                rating_element = product_element.select_one(selector)
                if rating_element:
                    rating_text = rating_element.get_text(strip=True)
                    rating_match = re.search(r'(\d+\.?\d*)\s*out\s*of\s*5', rating_text)
                    if rating_match:
                        product_data['rating'] = rating_match.group(1)
                        break
            
            # Extract number of ratings/reviews
            ratings_selectors = [
                'a[aria-label*="ratings"]',
                'span[aria-label*="ratings"]',
                '.a-size-base.s-underline-text'
            ]
            
            for selector in ratings_selectors:
                ratings_element = product_element.select_one(selector)
                if ratings_element:
                    aria_label = ratings_element.get('aria-label', '')
                    text_content = ratings_element.get_text(strip=True)
                    
                    # Try to extract from aria-label first
                    ratings_match = re.search(r'(\d+[\d,]*)\s*ratings?', aria_label)
                    if not ratings_match:
                        # Try from text content
                        ratings_match = re.search(r'(\d+[\d,]*)', text_content)
                    
                    if ratings_match:
                        product_data['total_ratings'] = ratings_match.group(1)
                        break
            
            # Extract image URL
            image_selectors = [
                '.s-image[src]',
                'img[data-image-latency][src]',
                '.s-product-image-container img[src]'
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
            
            # Check if sponsored
            sponsored_indicators = [
                'Sponsored' in product_element.get_text(),
                product_element.select_one('.puis-sponsored-label-text'),
                'data-component-type="s-sponsored-result"' in str(product_element)
            ]
            product_data['is_sponsored'] = any(sponsored_indicators)
            
            # Check if Prime eligible
            prime_element = product_element.select_one('.a-icon-prime')
            product_data['is_prime'] = prime_element is not None
            
            # Extract delivery information
            delivery_text = product_element.get_text()
            
            # Free delivery date
            free_delivery_match = re.search(r'FREE delivery\s+([^,\n]+)', delivery_text)
            if free_delivery_match:
                product_data['free_delivery_date'] = free_delivery_match.group(1).strip()
            
            # Fastest delivery date
            fastest_delivery_match = re.search(r'(?:Or\s+)?fastest delivery\s+([^,\n]+)', delivery_text)
            if fastest_delivery_match:
                product_data['fastest_delivery_date'] = fastest_delivery_match.group(1).strip()
            
            # Extract service information
            service_match = re.search(r'Service:\s*([^\n]+)', delivery_text)
            if service_match:
                product_data['service_info'] = service_match.group(1).strip()
            
            # Extract deal information
            deal_selectors = [
                '.a-badge-text',
                '[data-a-badge-color] .a-badge-text'
            ]
            
            for selector in deal_selectors:
                deal_element = product_element.select_one(selector)
                if deal_element:
                    deal_text = deal_element.get_text(strip=True)
                    if any(word in deal_text.lower() for word in ['deal', 'off', 'save']):
                        product_data['deal_info'] = deal_text
                        break
            
            # Extract "bought last month" info
            bought_match = re.search(r'(\d+\+?)\s*bought\s*in\s*past\s*month', delivery_text, re.IGNORECASE)
            if bought_match:
                product_data['bought_last_month'] = bought_match.group(1)
            
            # Process price data for numeric calculations
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
            
            # Extract EMI/financing info
            emi_match = re.search(r'(No Cost EMI|Save extra[^\.]*EMI[^\.]*)', delivery_text)
            if emi_match:
                product_data['emi_info'] = emi_match.group(1).strip()
        
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
                '[data-component-type="s-search-result"]',
                '[data-asin]:not([data-asin=""])',
                '.s-result-item[data-asin]',
                '.sg-col-inner .s-widget-container'
            ]
            
            products_found = []
            for selector in product_selectors:
                products = soup.select(selector)
                if products:
                    # Filter out empty data-asin
                    products_found = [p for p in products if p.get('data-asin')]
                    if products_found:
                        break
            
            if not products_found:
                logger.warning(f"No products found on page {page}")
                # Try alternative method
                products_found = soup.select('.s-result-item')
                if not products_found:
                    break
            
            logger.info(f"Found {len(products_found)} product containers on page {page}")
            
            for product_element in products_found:
                product_data = self.extract_product_data(product_element)
                
                # Only add products with meaningful data
                if product_data['name'] and (product_data['price'] or product_data['url']):
                    all_products.append(product_data)
            
            # Random delay between pages
            time.sleep(random.uniform(3, 7))
        
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
            'prime_products': len([p for p in products if p['is_prime']]),
            'products_with_deals': len([p for p in products if p['deal_info']]),
            'brands_found': list(set([p['brand'] for p in products if p['brand']])),
            'price_range': {},
            'avg_rating': 0
        }
        
        if products_with_price:
            prices = [p['price_numeric'] for p in products_with_price]
            summary['price_range'] = {
                'min_price': min(prices),
                'max_price': max(prices),
                'avg_price': sum(prices) // len(prices)
            }
        
        # Calculate average rating
        rated_products = [float(p['rating']) for p in products if p['rating']]
        if rated_products:
            summary['avg_rating'] = round(sum(rated_products) / len(rated_products), 2)
        
        return summary

# Function to scrape and return JSON
def scrape_amazon_products(search_term, max_pages=3):
    """Scrape Amazon products and return JSON data"""
    scraper = AmazonScraper()
    
    logger.info(f"Searching for '{search_term}' on Amazon India...")
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

# Example usage
def main():
    # Configuration
    search_term = "laptop"  # Change this to your desired search term
    max_pages = 3  # Number of pages to scrape
    
    # Scrape products
    result_json = scrape_amazon_products(search_term, max_pages)
    
    # Output JSON to console
    print(json.dumps(result_json, indent=2, ensure_ascii=False))
    
    # Also save to file
    filename = f"amazon_{search_term.replace(' ', '_')}_{int(time.time())}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result_json, f, indent=2, ensure_ascii=False)
    
    print(f"\n\nData also saved to: {filename}", file=sys.stderr)

# Alternative: Direct JSON output function
def get_amazon_products_json(search_term, max_pages=3):
    """
    Direct function to get Amazon products as JSON string
    Usage: json_string = get_amazon_products_json("laptop", 2)
    """
    result = scrape_amazon_products(search_term, max_pages)
    return json.dumps(result, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    import sys
    main()