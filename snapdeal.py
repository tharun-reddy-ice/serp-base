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

class SnapdealScraper:
    def __init__(self):
        self.base_url = "https://www.snapdeal.com/search?keyword={search_term}"
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
                elif response.status_code == 429:
                    # Rate limited
                    logger.warning(f"Rate limited, waiting before retry {attempt + 1}")
                    time.sleep(random.uniform(10, 20))
                else:
                    logger.warning(f"Status code {response.status_code}, attempt {attempt + 1}")
                    
            except requests.RequestException as e:
                logger.error(f"Request failed: {e}, attempt {attempt + 1}")
                time.sleep(random.uniform(5, 10))
        
        return None
    
    def extract_rating_from_width(self, width_percentage):
        """Convert width percentage to rating out of 5"""
        try:
            if '%' in width_percentage:
                percentage = float(width_percentage.replace('%', ''))
                rating = round((percentage / 100) * 5, 1)
                return str(rating)
        except:
            pass
        return ''
    
    def extract_product_data(self, product_element):
        """Extract data from a single Snapdeal product element from visible HTML only"""
        product_data = {
            'name': '',
            'url': '',
            'price': '',
            'original_price': '',
            'discount_percentage': '',
            'savings_amount': 0,
            'rating': '',
            'total_ratings': '',
            'image_url': '',
            'brand': '',
            'price_numeric': 0,
            'original_price_numeric': 0,
            'product_id': '',
            'colors_available': [],
            'sizes_available': [],
            'orders_last_week': '',
            'availability_info': ''
        }
        
        try:
            # Extract product ID from element attributes
            product_id = product_element.get('id', '')
            if product_id:
                product_data['product_id'] = product_id
            
            # Also try to get pogid attribute
            pogid = product_element.get('pogid')
            if pogid:
                product_data['product_id'] = pogid
            
            # Extract product name
            name_selectors = [
                '.product-title',
                'p[title]',
                '.product-desc-rating a p',
                'p.product-title'
            ]
            
            for selector in name_selectors:
                name_element = product_element.select_one(selector)
                if name_element:
                    product_data['name'] = name_element.get_text(strip=True)
                    # Also check title attribute for full name
                    title_attr = name_element.get('title')
                    if title_attr and len(title_attr) > len(product_data['name']):
                        product_data['name'] = title_attr
                    break
            
            # Extract URL
            url_selectors = [
                '.dp-widget-link[href]',
                'a[href*="/product/"]',
                '.product-desc-rating a[href]'
            ]
            
            for selector in url_selectors:
                url_element = product_element.select_one(selector)
                if url_element and url_element.get('href'):
                    href = url_element['href']
                    if href.startswith('https://'):
                        product_data['url'] = href
                    elif href.startswith('/'):
                        product_data['url'] = 'https://www.snapdeal.com' + href
                    else:
                        product_data['url'] = 'https://www.snapdeal.com/' + href
                    break
            
            # Extract current price
            price_selectors = [
                '.product-price',
                'span[id*="display-price"]',
                '.lfloat.product-price',
                '#display-price-' + str(product_data.get('product_id', ''))
            ]
            
            for selector in price_selectors:
                price_element = product_element.select_one(selector)
                if price_element:
                    price_text = price_element.get_text(strip=True)
                    product_data['price'] = price_text
                    
                    # Extract numeric value from text
                    price_numeric = re.sub(r'[^\d]', '', price_text)
                    if price_numeric:
                        product_data['price_numeric'] = int(price_numeric)
                    
                    # Also check data-price attribute
                    data_price = price_element.get('data-price')
                    if data_price:
                        product_data['price_numeric'] = int(data_price)
                    break
            
            # Extract original price
            original_price_selectors = [
                '.product-desc-price.strike',
                '.strike',
                '.lfloat.product-desc-price.strike',
                'span.strike'
            ]
            
            for selector in original_price_selectors:
                original_price_element = product_element.select_one(selector)
                if original_price_element:
                    original_price_text = original_price_element.get_text(strip=True)
                    product_data['original_price'] = original_price_text
                    # Extract numeric value
                    price_numeric = re.sub(r'[^\d]', '', original_price_text)
                    if price_numeric:
                        product_data['original_price_numeric'] = int(price_numeric)
                    break
            
            # Extract discount percentage
            discount_selectors = [
                '.product-discount span',
                '.product-discount',
                'div.product-discount span'
            ]
            
            for selector in discount_selectors:
                discount_element = product_element.select_one(selector)
                if discount_element:
                    discount_text = discount_element.get_text(strip=True)
                    if '%' in discount_text and 'off' in discount_text.lower():
                        product_data['discount_percentage'] = discount_text
                    break
            
            # Extract rating from filled-stars width percentage
            rating_element = product_element.select_one('.filled-stars')
            if rating_element:
                style = rating_element.get('style', '')
                width_match = re.search(r'width:\s*([^;]+)', style)
                if width_match:
                    width = width_match.group(1).strip()
                    product_data['rating'] = self.extract_rating_from_width(width)
            
            # Extract number of ratings from visible elements
            rating_count_selectors = [
                '.product-rating-count',
                'p.product-rating-count',
                '.rating p'
            ]
            
            for selector in rating_count_selectors:
                rating_count_element = product_element.select_one(selector)
                if rating_count_element:
                    rating_text = rating_count_element.get_text(strip=True)
                    # Extract number from parentheses like "(765)"
                    rating_match = re.search(r'\((\d+)\)', rating_text)
                    if rating_match:
                        product_data['total_ratings'] = rating_match.group(1)
                    # Also try direct number extraction
                    elif rating_text.isdigit():
                        product_data['total_ratings'] = rating_text
                    break
            
            # Extract image URL
            image_selectors = [
                '.product-image[src]',
                'img.product-image[src]',
                'picture img[src]',
                '.product-tuple-image img[src]'
            ]
            
            for selector in image_selectors:
                image_element = product_element.select_one(selector)
                if image_element and image_element.get('src'):
                    src = image_element['src']
                    if src.startswith('http'):
                        product_data['image_url'] = src
                    break
            
            # Extract brand from product name
            if product_data['name']:
                # Try to extract brand (usually the first word or two before a dash/hyphen)
                brand_patterns = [
                    r'^([A-Za-z\s]+?)[\s\-]+',  # Brand before dash or space
                    r'^([A-Za-z]+)',            # First word
                ]
                
                for pattern in brand_patterns:
                    brand_match = re.match(pattern, product_data['name'])
                    if brand_match:
                        brand = brand_match.group(1).strip()
                        if len(brand) > 1:  # Avoid single character brands
                            product_data['brand'] = brand
                            break
            
            # Extract available colors from color attributes
            color_elements = product_element.select('.color-attr')
            colors = []
            for color_elem in color_elements:
                style = color_elem.get('style', '')
                bg_match = re.search(r'background:\s*([^;]+)', style)
                if bg_match:
                    color_value = bg_match.group(1).strip()
                    if color_value and color_value not in ['', 'none']:
                        colors.append(color_value)
            product_data['colors_available'] = colors
            
            # Extract available sizes
            size_elements = product_element.select('.sub-attr-value')
            sizes = []
            for size_elem in size_elements:
                if 'hidden' not in size_elem.get('class', []):  # Skip hidden elements
                    size_text = size_elem.get_text(strip=True)
                    if size_text and size_text.isdigit():
                        sizes.append(size_text)
            product_data['sizes_available'] = list(set(sizes))  # Remove duplicates
            
            # Extract orders in last period information
            nudge_elements = product_element.select('.nudge-below-text, .nudge-with-background')
            for nudge_elem in nudge_elements:
                nudge_text = nudge_elem.get_text(strip=True)
                orders_match = re.search(r'(\d+)\s*orders?\s*in\s*last\s*(\d+)\s*days?', nudge_text, re.IGNORECASE)
                if orders_match:
                    product_data['orders_last_week'] = f"{orders_match.group(1)} orders in last {orders_match.group(2)} days"
                    break
            
            # Calculate savings if both prices are available
            if product_data['price_numeric'] and product_data['original_price_numeric']:
                product_data['savings_amount'] = product_data['original_price_numeric'] - product_data['price_numeric']
        
        except Exception as e:
            logger.error(f"Error extracting product data: {e}")
        
        return product_data
    
    def extract_hidden_data(self, soup):
        """Extract data from hidden input field with JSON data"""
        hidden_products = []
        try:
            hidden_input = soup.select_one('input.dp-info-collect')
            if hidden_input:
                value = hidden_input.get('value', '')
                # Parse the hidden data which contains product information
                # The format appears to be a list of dictionaries with keys k1-k9
                data_match = re.search(r'\[(.*)\]', value)
                if data_match:
                    data_str = data_match.group(1)
                    # Split by product entries
                    products_raw = re.findall(r'\{[^}]+\}', data_str)
                    
                    for product_raw in products_raw:
                        try:
                            product_data = {
                                'name': '',
                                'url': '',
                                'price': '',
                                'original_price': '',
                                'discount_percentage': '',
                                'rating': '',
                                'image_url': '',
                                'product_id': '',
                                'price_numeric': 0,
                                'original_price_numeric': 0
                            }
                            
                            # Extract k1 (image)
                            k1_match = re.search(r"'k1':\s*'([^']+)'", product_raw)
                            if k1_match:
                                product_data['image_url'] = k1_match.group(1)
                            
                            # Extract k2 (partial URL)
                            k2_match = re.search(r"'k2':\s*'([^']+)'", product_raw)
                            if k2_match:
                                product_data['url'] = 'https://www.snapdeal.com/' + k2_match.group(1)
                            
                            # Extract k3 (product ID)
                            k3_match = re.search(r"'k3':\s*'([^']+)'", product_raw)
                            if k3_match:
                                product_data['product_id'] = k3_match.group(1)
                            
                            # Extract k4 (name)
                            k4_match = re.search(r"'k4':\s*'([^']+)'", product_raw)
                            if k4_match:
                                product_data['name'] = k4_match.group(1)
                            
                            # Extract k5 (discount percentage)
                            k5_match = re.search(r"'k5':\s*'([^']+)'", product_raw)
                            if k5_match:
                                product_data['discount_percentage'] = k5_match.group(1) + '% Off'
                            
                            # Extract k6 (original price)
                            k6_match = re.search(r"'k6':\s*'([^']+)'", product_raw)
                            if k6_match:
                                product_data['original_price'] = 'Rs. ' + k6_match.group(1)
                                product_data['original_price_numeric'] = int(k6_match.group(1))
                            
                            # Extract k7 (current price)
                            k7_match = re.search(r"'k7':\s*'([^']+)'", product_raw)
                            if k7_match:
                                product_data['price'] = 'Rs. ' + k7_match.group(1)
                                product_data['price_numeric'] = int(k7_match.group(1))
                            
                            # Extract k8 (rating)
                            k8_match = re.search(r"'k8':\s*'([^']+)'", product_raw)
                            if k8_match:
                                product_data['rating'] = k8_match.group(1)
                            
                            # Calculate savings
                            if product_data['price_numeric'] and product_data['original_price_numeric']:
                                product_data['savings_amount'] = product_data['original_price_numeric'] - product_data['price_numeric']
                            
                            # Extract brand
                            if product_data['name']:
                                brand_match = re.match(r'^([A-Za-z\s]+?)[\s\-]', product_data['name'])
                                if brand_match:
                                    product_data['brand'] = brand_match.group(1).strip()
                            
                            hidden_products.append(product_data)
                        
                        except Exception as e:
                            logger.error(f"Error parsing hidden product data: {e}")
                            continue
        
        except Exception as e:
            logger.error(f"Error extracting hidden data: {e}")
        
        return hidden_products
    
    def search_products(self, search_term, max_pages=5):
        """Search for products and extract data from visible HTML only"""
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
            
            # Extract from visible HTML elements only
            product_selectors = [
                '.product-tuple-listing',
                '.js-tuple',
                '.favDp.product-tuple-listing'
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
        products_with_price = [p for p in products if p.get('price_numeric', 0) > 0]
        
        summary = {
            'total_products': total_products,
            'products_with_price': len(products_with_price),
            'products_with_rating': len([p for p in products if p.get('rating')]),
            'products_with_discounts': len([p for p in products if p.get('discount_percentage')]),
            'brands_found': list(set([p['brand'] for p in products if p.get('brand')])),
            'price_range': {},
            'avg_rating': 0,
            'avg_discount': 0
        }
        
        if products_with_price:
            prices = [p['price_numeric'] for p in products_with_price]
            summary['price_range'] = {
                'min_price': min(prices),
                'max_price': max(prices),
                'avg_price': sum(prices) // len(prices)
            }
        
        # Calculate average rating
        rated_products = []
        for p in products:
            if p.get('rating'):
                try:
                    rated_products.append(float(p['rating']))
                except:
                    pass
        if rated_products:
            summary['avg_rating'] = round(sum(rated_products) / len(rated_products), 2)
        
        # Calculate average discount
        discount_products = []
        for p in products:
            if p.get('discount_percentage'):
                discount_match = re.search(r'(\d+)', p['discount_percentage'])
                if discount_match:
                    discount_products.append(int(discount_match.group(1)))
        if discount_products:
            summary['avg_discount'] = round(sum(discount_products) / len(discount_products), 1)
        
        return summary

# Function to scrape and return JSON
def scrape_snapdeal_products(search_term, max_pages=3):
    """Scrape Snapdeal products and return JSON data"""
    scraper = SnapdealScraper()
    
    logger.info(f"Searching for '{search_term}' on Snapdeal...")
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
def get_snapdeal_products_json(search_term, max_pages=3):
    """
    Direct function to get Snapdeal products as JSON string
    Usage: json_string = get_snapdeal_products_json("pants", 2)
    """
    result = scrape_snapdeal_products(search_term, max_pages)
    return json.dumps(result, indent=2, ensure_ascii=False)

# Example usage
def main():
    # Configuration
    search_term = "pants and trouser"  # Change this to your desired search term
    max_pages = 3  # Number of pages to scrape
    
    # Scrape products
    result_json = scrape_snapdeal_products(search_term, max_pages)
    
    # Output JSON to console
    print(json.dumps(result_json, indent=2, ensure_ascii=False))
    
    # Also save to file
    filename = f"snapdeal_{search_term.replace(' ', '_')}_{int(time.time())}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result_json, f, indent=2, ensure_ascii=False)
    
    print(f"\n\nData also saved to: {filename}", file=sys.stderr)

if __name__ == "__main__":
    import sys
    main()