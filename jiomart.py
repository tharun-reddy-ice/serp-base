import requests
from bs4 import BeautifulSoup
import json
import re
import time
import random
from urllib.parse import quote
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JioMartScraper:
    def __init__(self):
        self.base_url = "https://www.jiomart.com/search/{search_term}"
        self.session = requests.Session()
        
        # More realistic and recent user agents
        self.user_agents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        ]
        
        # Enhanced headers to better mimic real browsers
        self.base_headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"'
        }
        
        # Set up session with cookies
        self.session.cookies.update({
            'lang': 'en',
            'deviceId': f'web-{random.randint(10000000, 99999999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(100000000000, 999999999999)}',
            'visitId': str(random.randint(1000000000000, 9999999999999))
        })
    
    def get_random_user_agent(self):
        return random.choice(self.user_agents)
    
    def encode_search_term(self, search_term):
        """Encode search term in the format: biscuits%20digestive"""
        return quote(search_term, safe='')
    
    def build_search_url(self, search_term, page=1):
        """Build properly encoded search URL with pagination"""
        encoded_term = self.encode_search_term(search_term)
        
        if page == 1:
            # First page: https://www.jiomart.com/search/biscuits%20digestive
            url = f"https://www.jiomart.com/search/{encoded_term}"
        else:
            # Subsequent pages: https://www.jiomart.com/search/biscuits%20digestive?page=2
            url = f"https://www.jiomart.com/search/{encoded_term}?page={page}"
        
        return url
    
    def make_request(self, url, max_retries=3):
        """Make HTTP request with enhanced stealth techniques"""
        for attempt in range(max_retries):
            try:
                # Create fresh headers for each request
                headers = self.base_headers.copy()
                headers['User-Agent'] = self.get_random_user_agent()
                
                # Add referer for subsequent requests
                if attempt > 0:
                    headers['Referer'] = 'https://www.jiomart.com/'
                
                # Random delay between requests (longer delays)
                time.sleep(random.uniform(5, 10))
                
                logger.info(f"Attempting request to: {url}")
                response = self.session.get(url, headers=headers, timeout=20)
                
                logger.info(f"Response status: {response.status_code}")
                
                if response.status_code == 200:
                    return response
                elif response.status_code == 400:
                    logger.warning(f"Bad request (400) - possibly blocked. Attempt {attempt + 1}")
                    time.sleep(random.uniform(10, 20))
                elif response.status_code == 429:
                    logger.warning(f"Rate limited (429), waiting before retry {attempt + 1}")
                    time.sleep(random.uniform(20, 40))
                elif response.status_code == 403:
                    logger.warning(f"Forbidden (403) - access denied. Attempt {attempt + 1}")
                    time.sleep(random.uniform(15, 30))
                else:
                    logger.warning(f"Status code {response.status_code}, attempt {attempt + 1}")
                    time.sleep(random.uniform(5, 10))
                    
            except requests.RequestException as e:
                logger.error(f"Request failed: {e}, attempt {attempt + 1}")
                time.sleep(random.uniform(10, 20))
        
        return None
    
    def extract_product_data(self, product_element):
        """Extract data from a single JioMart product element"""
        product_data = {
            'name': '',
            'url': '',
            'price': '',
            'original_price': '',
            'discount_percentage': '',
            'savings_amount': 0,
            'image_url': '',
            'brand': '',
            'price_numeric': 0,
            'original_price_numeric': 0,
            'product_id': '',
            'seller_name': '',
            'manufacturer': '',
            'category': '',
            'subcategory': '',
            'l4category': '',
            'vertical': '',
            'is_fulfilled_by_jiomart': False,
            'variant_info': '',
            'food_type': 'veg'  # Default to veg based on the icon in sample
        }
        
        try:
            # Extract from GTM Events data attributes (most reliable source)
            gtm_element = product_element.select_one('.gtmEvents')
            if gtm_element:
                # Extract data attributes
                data_attrs = {
                    'name': gtm_element.get('data-name', ''),
                    'id': gtm_element.get('data-id', ''),
                    'manu': gtm_element.get('data-manu', ''),
                    'brandid': gtm_element.get('data-brandid', ''),
                    'cate': gtm_element.get('data-cate', ''),
                    'subcate': gtm_element.get('data-subcate', ''),
                    'l4category': gtm_element.get('data-l4category', ''),
                    'vertical': gtm_element.get('data-vertical', ''),
                    'price': gtm_element.get('data-price', ''),
                    'sellername': gtm_element.get('data-sellername', ''),
                    'image': gtm_element.get('data-image', ''),
                    'alternate': gtm_element.get('data-alternate', '')
                }
                
                # Set extracted data
                product_data['name'] = data_attrs['name']
                product_data['product_id'] = data_attrs['id']
                product_data['brand'] = data_attrs['manu']
                product_data['manufacturer'] = data_attrs['manu']
                product_data['category'] = data_attrs['cate']
                product_data['subcategory'] = data_attrs['subcate']
                product_data['l4category'] = data_attrs['l4category']
                product_data['vertical'] = data_attrs['vertical']
                product_data['seller_name'] = data_attrs['sellername']
                
                # Set price from data attribute
                if data_attrs['price']:
                    try:
                        product_data['price_numeric'] = float(data_attrs['price'])
                        product_data['price'] = f"₹{data_attrs['price']}"
                    except:
                        pass
            
            # Extract product name from visible elements (fallback)
            if not product_data['name']:
                name_selectors = [
                    '.plp-card-details-name',
                    '.jm-body-xs.jm-fc-primary-grey-80',
                    'h2 span',
                    '[title]'
                ]
                
                for selector in name_selectors:
                    name_element = product_element.select_one(selector)
                    if name_element:
                        product_data['name'] = name_element.get_text(strip=True)
                        # Also check title attribute
                        title_attr = name_element.get('title')
                        if title_attr and len(title_attr) > len(product_data['name']):
                            product_data['name'] = title_attr
                        break
            
            # Extract URL
            url_selectors = [
                'a[href*="/p/"]',
                '.plp-card-wrapper[href]',
                'a.plp-card-wrapper'
            ]
            
            for selector in url_selectors:
                url_element = product_element.select_one(selector)
                if url_element and url_element.get('href'):
                    href = url_element['href']
                    if href.startswith('/'):
                        product_data['url'] = 'https://www.jiomart.com' + href
                    elif href.startswith('https://'):
                        product_data['url'] = href
                    else:
                        product_data['url'] = 'https://www.jiomart.com/' + href
                    break
            
            # Extract current price from visible elements
            if not product_data['price']:
                price_selectors = [
                    '.jm-heading-xxs.jm-mb-xxs',
                    '.plp-card-details-price span.jm-heading-xxs',
                    'span.jm-heading-xxs'
                ]
                
                for selector in price_selectors:
                    price_element = product_element.select_one(selector)
                    if price_element:
                        price_text = price_element.get_text(strip=True)
                        if '₹' in price_text:
                            product_data['price'] = price_text
                            # Extract numeric value
                            price_numeric = re.sub(r'[^\d.]', '', price_text)
                            if price_numeric:
                                try:
                                    product_data['price_numeric'] = float(price_numeric)
                                except:
                                    pass
                            break
            
            # Extract original price (MRP)
            original_price_selectors = [
                '.line-through',
                '.jm-fc-primary-grey-60.line-through',
                'span.line-through'
            ]
            
            for selector in original_price_selectors:
                original_price_element = product_element.select_one(selector)
                if original_price_element:
                    original_price_text = original_price_element.get_text(strip=True)
                    if '₹' in original_price_text:
                        product_data['original_price'] = original_price_text
                        # Extract numeric value
                        price_numeric = re.sub(r'[^\d.]', '', original_price_text)
                        if price_numeric:
                            try:
                                product_data['original_price_numeric'] = float(price_numeric)
                            except:
                                pass
                        break
            
            # Extract discount percentage
            discount_selectors = [
                '.jm-badge',
                '.plp-card-details-discount .jm-badge',
                'span.jm-badge'
            ]
            
            for selector in discount_selectors:
                discount_element = product_element.select_one(selector)
                if discount_element:
                    discount_text = discount_element.get_text(strip=True)
                    if '%' in discount_text and 'off' in discount_text.lower():
                        product_data['discount_percentage'] = discount_text
                        break
            
            # Extract image URL
            image_selectors = [
                'img[src*="jiomart.com/images"]',
                '.plp-card-image img[src]',
                'img.lazyloaded[src]',
                'img[data-src]'
            ]
            
            for selector in image_selectors:
                image_element = product_element.select_one(selector)
                if image_element:
                    src = image_element.get('src') or image_element.get('data-src')
                    if src and 'jiomart-default-image' not in src:
                        product_data['image_url'] = src
                        break
            
            # Check if fulfilled by JioMart
            fulfillment_element = product_element.select_one('.jm-badge-popular-curve')
            if fulfillment_element and 'Fulfilled By JioMart' in fulfillment_element.get_text():
                product_data['is_fulfilled_by_jiomart'] = True
            
            # Extract variant information (like size options)
            variant_element = product_element.select_one('.variant_dropdown')
            if variant_element:
                variant_value = variant_element.select_one('.variant_value')
                if variant_value:
                    product_data['variant_info'] = variant_value.get_text(strip=True)
            
            # Check food type (veg/non-veg)
            food_type_element = product_element.select_one('.plp-card-foodtype img')
            if food_type_element:
                src = food_type_element.get('src', '')
                if 'non-veg' in src:
                    product_data['food_type'] = 'non-veg'
                elif 'veg' in src:
                    product_data['food_type'] = 'veg'
            
            # Calculate savings if both prices are available
            if product_data['price_numeric'] and product_data['original_price_numeric']:
                product_data['savings_amount'] = product_data['original_price_numeric'] - product_data['price_numeric']
            
            # Extract product ID from data attributes if not already set
            if not product_data['product_id']:
                data_objid = product_element.get('data-objid')
                if data_objid:
                    product_data['product_id'] = data_objid
        
        except Exception as e:
            logger.error(f"Error extracting product data: {e}")
        
        return product_data
    
    def search_products(self, search_term, max_pages=5):
        """Search for products and extract data with proper URL encoding"""
        all_products = []
        
        for page in range(1, max_pages + 1):
            logger.info(f"Scraping page {page} for '{search_term}'")
            
            # Build properly encoded URL
            url = self.build_search_url(search_term, page)
            logger.info(f"Built URL: {url}")
            
            response = self.make_request(url)
            
            if not response:
                logger.error(f"Failed to fetch page {page}")
                continue
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find product containers using multiple selectors
            product_selectors = [
                '.ais-InfiniteHits-item',
                'li.ais-InfiniteHits-item',
                '.plp-card-wrapper',
                'a.plp-card-wrapper',
                '[data-objid]',
                '.gtmEvents'
            ]
            
            products_found = []
            for selector in product_selectors:
                products = soup.select(selector)
                if products:
                    products_found = products
                    logger.info(f"Found {len(products)} products using selector: {selector}")
                    break
            
            if not products_found:
                logger.warning(f"No products found on page {page}")
                # Try alternative selectors for debugging
                logger.info("Trying alternative selectors for debugging...")
                all_divs = soup.find_all('div', class_=True)
                logger.info(f"Found {len(all_divs)} divs with classes")
                
                # Look for common product container patterns
                for div in all_divs[:10]:  # Check first 10 divs
                    classes = ' '.join(div.get('class', []))
                    if any(keyword in classes.lower() for keyword in ['product', 'item', 'card']):
                        logger.info(f"Potential product container: {classes}")
                
                break
            
            logger.info(f"Found {len(products_found)} product containers on page {page}")
            
            page_products = 0
            for product_element in products_found:
                product_data = self.extract_product_data(product_element)
                
                # Only add products with meaningful data
                if product_data['name'] and (product_data['price'] or product_data['url']):
                    all_products.append(product_data)
                    page_products += 1
            
            logger.info(f"Extracted {page_products} valid products from page {page}")
            
            # If no products found on this page, might be end of results
            if page_products == 0:
                logger.info("No valid products found on this page, stopping pagination")
                break
            
            # Check if there are more pages
            load_more_button = soup.select_one('.ais-InfiniteHits-loadMore')
            if not load_more_button or 'disabled' in load_more_button.get('class', []):
                logger.info("No more pages available")
                break
            
            # Random delay between pages
            time.sleep(random.uniform(8, 15))
        
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
            return {'total_products': 0}
        
        total_products = len(products)
        products_with_price = [p for p in products if p.get('price_numeric', 0) > 0]
        
        summary = {
            'total_products': total_products,
            'products_with_price': len(products_with_price),
            'products_with_discounts': len([p for p in products if p.get('discount_percentage')]),
            'fulfilled_by_jiomart': len([p for p in products if p.get('is_fulfilled_by_jiomart')]),
            'brands_found': list(set([p['brand'] for p in products if p.get('brand')])),
            'categories_found': list(set([p['category'] for p in products if p.get('category')])),
            'sellers_found': list(set([p['seller_name'] for p in products if p.get('seller_name')])),
            'price_range': {},
            'avg_discount': 0,
            'food_types': {
                'veg': len([p for p in products if p.get('food_type') == 'veg']),
                'non_veg': len([p for p in products if p.get('food_type') == 'non-veg'])
            }
        }
        
        if products_with_price:
            prices = [p['price_numeric'] for p in products_with_price]
            summary['price_range'] = {
                'min_price': min(prices),
                'max_price': max(prices),
                'avg_price': round(sum(prices) / len(prices), 2)
            }
        
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

# Alternative browser automation approach (requires selenium)
def scrape_jiomart_with_selenium(search_term, max_pages=3):
    """
    Alternative scraper using Selenium WebDriver for better stealth
    Requires: pip install selenium webdriver-manager
    """
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.chrome.options import Options
        from webdriver_manager.chrome import ChromeDriverManager
        from selenium.webdriver.chrome.service import Service
        
        # Set up Chrome options for stealth
        chrome_options = Options()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Uncomment next line to run headless
        # chrome_options.add_argument('--headless')
        
        # Set up driver
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Execute script to remove webdriver property
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        all_products = []
        scraper = JioMartScraper()
        
        for page in range(1, max_pages + 1):
            # Use the same URL building logic
            url = scraper.build_search_url(search_term, page)
            
            logger.info(f"Loading page {page}: {url}")
            driver.get(url)
            
            # Wait for products to load
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".ais-InfiniteHits-item, .plp-card-wrapper"))
                )
                time.sleep(random.uniform(2, 5))  # Additional wait for dynamic content
            except:
                logger.warning(f"Timeout waiting for products on page {page}")
                continue
            
            # Get page source and parse with BeautifulSoup
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            
            # Extract products using the same logic
            product_elements = soup.select('.ais-InfiniteHits-item')
            
            page_products = []
            for element in product_elements:
                product_data = scraper.extract_product_data(element)
                if product_data['name'] and (product_data['price'] or product_data['url']):
                    page_products.append(product_data)
            
            all_products.extend(page_products)
            logger.info(f"Extracted {len(page_products)} products from page {page}")
            
            # Random delay between pages
            time.sleep(random.uniform(3, 8))
        
        driver.quit()
        
        return {
            'search_term': search_term,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_pages_scraped': max_pages,
            'summary': scraper.get_search_summary(all_products),
            'products': all_products,
            'method': 'selenium'
        }
        
    except ImportError:
        logger.error("Selenium not installed. Run: pip install selenium webdriver-manager")
        return None
    except Exception as e:
        logger.error(f"Selenium scraping failed: {e}")
        return None

# Function to scrape and return JSON
def scrape_jiomart_products(search_term, max_pages=3):
    """Scrape JioMart products and return JSON data"""
    scraper = JioMartScraper()
    
    logger.info(f"Searching for '{search_term}' on JioMart...")
    logger.info(f"Example URL will be: {scraper.build_search_url(search_term, 1)}")
    
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

# Function to try both methods
def scrape_jiomart_products_robust(search_term, max_pages=3):
    """
    Try multiple scraping methods - direct requests first, then Selenium
    """
    logger.info("Attempting direct HTTP requests first...")
    
    # Try direct requests method
    result = scrape_jiomart_products(search_term, max_pages)
    
    if result and result.get('summary', {}).get('total_products', 0) > 0:
        logger.info(f"Direct requests successful! Found {result['summary']['total_products']} products")
        return result
    
    logger.info("Direct requests failed or found no products. Trying Selenium method...")
    
    # Try Selenium method
    selenium_result = scrape_jiomart_with_selenium(search_term, max_pages)
    
    if selenium_result and selenium_result.get('summary', {}).get('total_products', 0) > 0:
        logger.info(f"Selenium method successful! Found {selenium_result['summary']['total_products']} products")
        return selenium_result
    
    logger.error("All methods failed to scrape products")
    return {
        'search_term': search_term,
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'total_pages_scraped': max_pages,
        'summary': {'total_products': 0},
        'products': [],
        'error': 'All scraping methods failed - website may be blocking automated access',
        'suggestion': 'Try using a VPN, different network, or manual scraping'
    }

# Test URL encoding function
def test_url_encoding():
    """Test the URL encoding with different search terms"""
    scraper = JioMartScraper()
    
    test_terms = [
        "biscuits digestive",
        "rice basmati",
        "milk dairy",
        "tea leaves"
    ]
    
    print("Testing URL encoding:")
    print("=" * 50)
    
    for term in test_terms:
        url1 = scraper.build_search_url(term, 1)
        url2 = scraper.build_search_url(term, 2)
        
        print(f"Search term: '{term}'")
        print(f"Page 1: {url1}")
        print(f"Page 2: {url2}")
        print()

# Example usage with robust fallback
def main():
    # Configuration
    search_term = "biscuits digestive"  # Change this to your desired search term
    max_pages = 3  # Number of pages to scrape
    
    print("JioMart Scraper - Fixed URL Encoding")
    print("=" * 50)
    
    # Show URL encoding test
    test_url_encoding()
    
    # Try robust method with fallbacks
    result_json = scrape_jiomart_products_robust(search_term, max_pages)
    
    # Output JSON to console
    print(json.dumps(result_json, indent=2, ensure_ascii=False))
    
    # Also save to file
    filename = f"jiomart_{search_term.replace(' ', '_')}_{int(time.time())}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result_json, f, indent=2, ensure_ascii=False)
    
    print(f"\n\nData also saved to: {filename}", file=sys.stderr)
    
    # Print summary
    if result_json.get('summary', {}).get('total_products', 0) > 0:
        summary = result_json['summary']
        print(f"\n✅ SUCCESS! Found {summary['total_products']} products", file=sys.stderr)
        print(f"Method used: {result_json.get('method', 'direct_requests')}", file=sys.stderr)
        if summary.get('brands_found'):
            print(f"Brands: {', '.join(summary['brands_found'][:5])}", file=sys.stderr)
    else:
        print(f"\n❌ FAILED: {result_json.get('error', 'No products found')}", file=sys.stderr)
        print(f"Suggestion: {result_json.get('suggestion', 'Try again later')}", file=sys.stderr)

if __name__ == "__main__":
    import sys
    main()