#!/usr/bin/env python3
"""
Yangon Branded Perfume - Full Product Crawler
Crawls all products from the sitemap and extracts detailed product data.
"""

import json
import re
import sys
import time
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
from html.parser import HTMLParser
from xml.etree import ElementTree as ET

# ─── CONFIG ───────────────────────────────────────────────────────
SITEMAP_URL = "https://www.yangonbrandedperfume.com/store-products-sitemap.xml"
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_JSON = os.path.join(OUTPUT_DIR, "products.json")
OUTPUT_CSV = os.path.join(OUTPUT_DIR, "products.csv")
MAX_WORKERS = 8  # concurrent requests
RETRY_COUNT = 2
DELAY_BETWEEN_BATCHES = 0.5  # seconds

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


# ─── HTML PARSER for Product Pages ──────────────────────────────
class ProductPageParser(HTMLParser):
    """Extracts product data from Wix product page HTML."""

    def __init__(self):
        super().__init__()
        self.data = {
            "name": "",
            "price": "",
            "currency": "MMK",
            "description": "",
            "images": [],
            "sku": "",
            "in_stock": True,
            "og_description": "",
            "og_image": "",
            "brand": "",
        }
        self._in_title = False
        self._in_description = False
        self._current_tag = ""
        self._meta_collected = False
        self._description_parts = []
        self._capture_text = False
        self._text_buffer = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        self._current_tag = tag

        # Extract from meta tags (most reliable on Wix)
        if tag == "meta":
            name = attrs_dict.get("name", "").lower()
            prop = attrs_dict.get("property", "").lower()
            content = attrs_dict.get("content", "")

            if prop == "og:title" and content:
                # OG title usually has the product name
                self.data["name"] = content.split("|")[0].strip()
            elif prop == "og:description" and content:
                self.data["og_description"] = content
            elif prop == "og:image" and content:
                self.data["og_image"] = content
            elif name == "description" and content:
                if not self.data["og_description"]:
                    self.data["og_description"] = content

        # Extract from title tag
        if tag == "title":
            self._in_title = True
            self._text_buffer = ""

        # Collect product images from Wix static CDN
        if tag == "img":
            src = attrs_dict.get("src", "")
            if "static.wixstatic.com" in src and src not in self.data["images"]:
                self.data["images"].append(src)

        # Also check wix-image or data-src
        if tag in ("img", "wow-image"):
            for attr_name in ("src", "data-src"):
                src = attrs_dict.get(attr_name, "")
                if "static.wixstatic.com" in src and src not in self.data["images"]:
                    self.data["images"].append(src)

        # JSON-LD structured data
        if tag == "script" and attrs_dict.get("type") == "application/ld+json":
            self._capture_text = True
            self._text_buffer = ""

    def handle_endtag(self, tag):
        if tag == "title" and self._in_title:
            self._in_title = False
            if self._text_buffer and not self.data["name"]:
                self.data["name"] = self._text_buffer.split("|")[0].strip()

        if tag == "script" and self._capture_text:
            self._capture_text = False
            self._parse_jsonld(self._text_buffer)

    def handle_data(self, data):
        if self._in_title:
            self._text_buffer += data
        if self._capture_text:
            self._text_buffer += data

    def _parse_jsonld(self, json_str):
        """Parse JSON-LD structured data for product info."""
        try:
            ld = json.loads(json_str)
            if isinstance(ld, list):
                for item in ld:
                    self._extract_from_ld(item)
            else:
                self._extract_from_ld(ld)
        except (json.JSONDecodeError, ValueError):
            pass

    def _extract_from_ld(self, ld):
        """Extract product fields from a JSON-LD object."""
        ld_type = ld.get("@type", "")
        if ld_type == "Product" or ld_type == ["Product"]:
            if ld.get("name"):
                self.data["name"] = ld["name"]
            if ld.get("description"):
                self.data["description"] = ld["description"]
            if ld.get("sku"):
                self.data["sku"] = ld["sku"]
            if ld.get("brand"):
                brand = ld["brand"]
                if isinstance(brand, dict):
                    self.data["brand"] = brand.get("name", "")
                else:
                    self.data["brand"] = str(brand)
            if ld.get("image"):
                imgs = ld["image"]
                if isinstance(imgs, str):
                    imgs = [imgs]
                for img in imgs:
                    if img not in self.data["images"]:
                        self.data["images"].append(img)

            # Price from offers
            offers = ld.get("offers", {})
            if isinstance(offers, list):
                offers = offers[0] if offers else {}
            if offers:
                price = offers.get("price", "")
                currency = offers.get("priceCurrency", "MMK")
                availability = offers.get("availability", "")
                if price:
                    self.data["price"] = str(price)
                if currency:
                    self.data["currency"] = currency
                if "OutOfStock" in str(availability):
                    self.data["in_stock"] = False


def extract_price_from_text(text):
    """Extract MMK price from text like 'PriceMMK 189,000' or 'K 189,000'."""
    patterns = [
        r"MMK\s*([\d,]+)",
        r"K\s*([\d,]+)",
        r"([\d,]+)\s*(?:Kyat|kyat|ks|Ks)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).replace(",", "")
    return ""


def extract_brand_from_name(name):
    """Try to extract brand from product name."""
    known_brands = [
        "Abercrombie & Fitch", "Acqua di Parma", "Adidas", "Afnan", "Agent Provocateur",
        "Al Haramain", "Alfred Sung", "Amouage", "Anna Sui", "Antonio Banderas",
        "Armaf", "Armani", "Atelier Cologne", "Azzaro", "Banana Republic",
        "Benetton", "Bentley", "Boucheron", "Britney Spears", "Bvlgari",
        "Burberry", "Byblos", "Calvin Klein", "Carolina Herrera", "Chanel",
        "Christian Dior", "Clinique", "Coach", "Creed", "Davidoff",
        "David Beckham", "DKNY", "Dolce & Gabbana", "Dunhill", "Dua",
        "Elizabeth Arden", "Elizabeth Taylor", "Escada", "Estee Lauder",
        "Ferrari", "Goldfield & Banks", "Gucci", "Guerlain", "Guess",
        "Hugo Boss", "Hermes", "Issey Miyake", "Jean Paul Gaultier",
        "Jimmy Choo", "John Varvatos", "Kenzo", "Kilian", "La Rive",
        "Lalique", "Lancome", "Lattafa", "Lacoste", "Maison Margiela",
        "Mancera", "Marc Jacobs", "Michael Kors", "Miu Miu", "Moncler",
        "Mont Blanc", "Montale", "Mugler", "Narciso Rodriguez", "Nautica",
        "Nina Ricci", "Nishane", "Paco Rabanne", "Parfums De Marly",
        "Playboy", "Police", "Prada", "Ralph Lauren", "Rasasi",
        "Roja", "Roberto Cavalli", "Rochas", "Salvatore Ferragamo",
        "Stephane Humbert Lucas", "Tom Ford", "Tommy Hilfiger",
        "Valentino", "Van Cleef", "Versace", "Viktor & Rolf",
        "YSL", "Yves Saint Laurent", "Zara", "Clean Reserve",
    ]
    name_lower = name.lower()
    for brand in known_brands:
        if brand.lower() in name_lower:
            return brand
    return ""


# ─── NETWORK FUNCTIONS ──────────────────────────────────────────
def fetch_url(url, retries=RETRY_COUNT):
    """Fetch URL content with retries."""
    for attempt in range(retries + 1):
        try:
            req = Request(url, headers=HEADERS)
            with urlopen(req, timeout=30) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except (HTTPError, URLError, TimeoutError) as e:
            if attempt < retries:
                time.sleep(1 * (attempt + 1))
            else:
                print(f"  ✗ Failed after {retries + 1} attempts: {url} — {e}", file=sys.stderr)
                return None


def fetch_sitemap_products():
    """Fetch and parse the product sitemap XML using regex (avoids namespace issues)."""
    print("📦 Fetching product sitemap...")
    xml_content = fetch_url(SITEMAP_URL)
    if not xml_content:
        print("✗ Failed to fetch sitemap!", file=sys.stderr)
        sys.exit(1)

    # Use regex to extract <url> blocks (avoids XML namespace binding issues)
    url_blocks = re.findall(r'<url>(.*?)</url>', xml_content, re.DOTALL)
    products = []

    for block in url_blocks:
        loc_match = re.search(r'<loc>(.*?)</loc>', block)
        lastmod_match = re.search(r'<lastmod>(.*?)</lastmod>', block)
        image_locs = re.findall(r'<image:loc>(.*?)</image:loc>', block)

        if not loc_match:
            continue

        loc = loc_match.group(1).strip()
        lastmod = lastmod_match.group(1).strip() if lastmod_match else ""

        if "/product-page/" in loc:
            slug = loc.split("/product-page/")[-1]
            products.append({
                "url": loc,
                "slug": slug,
                "lastmod": lastmod,
                "sitemap_images": image_locs,
            })

    print(f"  ✓ Found {len(products)} products in sitemap")
    return products


def crawl_product(product_info):
    """Crawl a single product page and extract all data."""
    url = product_info["url"]
    slug = product_info["slug"]

    html = fetch_url(url)
    if not html:
        return {
            **product_info,
            "name": slug.replace("-", " ").title(),
            "price": "",
            "currency": "MMK",
            "description": "",
            "og_description": "",
            "images": product_info.get("sitemap_images", []),
            "brand": "",
            "sku": "",
            "in_stock": True,
            "crawl_error": True,
        }

    # Parse HTML
    parser = ProductPageParser()
    try:
        parser.feed(html)
    except Exception:
        pass

    data = parser.data

    # If no price from JSON-LD, try extracting from OG description or HTML text
    if not data["price"] and data["og_description"]:
        data["price"] = extract_price_from_text(data["og_description"])

    # Extract price from raw HTML if still not found
    if not data["price"]:
        price = extract_price_from_text(html)
        if price:
            data["price"] = price

    # Extract brand if not from JSON-LD
    if not data["brand"]:
        data["brand"] = extract_brand_from_name(data["name"])

    # Merge sitemap images with page images
    all_images = list(data["images"])
    for img in product_info.get("sitemap_images", []):
        if img not in all_images:
            all_images.append(img)

    # Extract description from OG description if not from JSON-LD
    description = data["description"] or data["og_description"]

    # Determine gender/category from name and description
    name_lower = data["name"].lower()
    desc_lower = description.lower()
    if "for women" in name_lower or "for women" in desc_lower or "pour femme" in name_lower:
        gender = "Women"
    elif "for men" in name_lower or "for men" in desc_lower or "pour homme" in name_lower:
        gender = "Men"
    elif "unisex" in name_lower or "unisex" in desc_lower:
        gender = "Unisex"
    else:
        gender = "Unknown"

    # Determine product type
    if "decant" in name_lower or "decant" in slug:
        product_type = "Decant"
    elif "tester" in name_lower:
        product_type = "Tester"
    elif "gift set" in name_lower or "set" in name_lower:
        product_type = "Gift Set"
    elif "deodorant" in name_lower:
        product_type = "Deodorant"
    elif "hair perfume" in name_lower:
        product_type = "Hair Perfume"
    else:
        product_type = "Full Bottle"

    # Extract size from name
    size_match = re.search(r"(\d+)\s*ml", name_lower)
    size = f"{size_match.group(1)}ml" if size_match else ""

    # Extract fragrance concentration
    conc = ""
    for c in ["Extrait de Parfum", "Eau de Parfum", "EDP", "EDT", "Eau de Toilette", "Parfum", "Cologne"]:
        if c.lower() in name_lower or c.lower() in desc_lower:
            conc = c
            break

    return {
        "slug": slug,
        "url": url,
        "name": data["name"],
        "brand": data["brand"],
        "price": data["price"],
        "currency": data["currency"],
        "gender": gender,
        "product_type": product_type,
        "concentration": conc,
        "size": size,
        "description": description,
        "sku": data["sku"],
        "in_stock": data["in_stock"],
        "images": all_images[:10],  # limit to 10 images
        "image_count": len(all_images),
        "lastmod": product_info.get("lastmod", ""),
        "crawl_error": False,
    }


def save_csv(products, filepath):
    """Save products to CSV."""
    import csv
    fields = [
        "slug", "name", "brand", "price", "currency", "gender",
        "product_type", "concentration", "size", "description",
        "sku", "in_stock", "image_count", "url", "lastmod",
    ]
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for p in products:
            writer.writerow(p)
    print(f"  ✓ CSV saved: {filepath}")


def main():
    start = time.time()

    # Step 1: Fetch sitemap
    sitemap_products = fetch_sitemap_products()

    # Step 2: Crawl all product pages
    print(f"\n🔍 Crawling {len(sitemap_products)} product pages ({MAX_WORKERS} workers)...")
    results = []
    errors = 0
    completed = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {}
        for i, product in enumerate(sitemap_products):
            future = executor.submit(crawl_product, product)
            futures[future] = product

        for future in as_completed(futures):
            completed += 1
            try:
                result = future.result()
                results.append(result)
                if result.get("crawl_error"):
                    errors += 1
                if completed % 25 == 0 or completed == len(sitemap_products):
                    elapsed = time.time() - start
                    rate = completed / elapsed if elapsed > 0 else 0
                    print(f"  [{completed}/{len(sitemap_products)}] {rate:.1f} products/sec — Last: {result['name'][:60]}")
            except Exception as e:
                errors += 1
                print(f"  ✗ Error processing: {e}", file=sys.stderr)

    # Sort by brand then name
    results.sort(key=lambda x: (x.get("brand", ""), x.get("name", "")))

    # Step 3: Save results
    print(f"\n💾 Saving {len(results)} products...")

    # JSON
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump({
            "crawl_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "source": "https://www.yangonbrandedperfume.com",
            "total_products": len(results),
            "errors": errors,
            "products": results,
        }, f, indent=2, ensure_ascii=False)
    print(f"  ✓ JSON saved: {OUTPUT_JSON}")

    # CSV
    save_csv(results, OUTPUT_CSV)

    # Step 4: Summary stats
    elapsed = time.time() - start
    brands = set(p["brand"] for p in results if p["brand"])
    genders = {}
    types = {}
    price_range = {"min": float("inf"), "max": 0}

    for p in results:
        g = p.get("gender", "Unknown")
        genders[g] = genders.get(g, 0) + 1
        t = p.get("product_type", "Other")
        types[t] = types.get(t, 0) + 1
        try:
            price = int(p["price"]) if p["price"] else 0
            if price > 0:
                price_range["min"] = min(price_range["min"], price)
                price_range["max"] = max(price_range["max"], price)
        except ValueError:
            pass

    print(f"\n{'='*60}")
    print(f"📊 CRAWL SUMMARY")
    print(f"{'='*60}")
    print(f"  Total products: {len(results)}")
    print(f"  Successful:     {len(results) - errors}")
    print(f"  Errors:         {errors}")
    print(f"  Unique brands:  {len(brands)}")
    print(f"  Time elapsed:   {elapsed:.1f}s")
    print(f"\n  By Gender:")
    for g, c in sorted(genders.items(), key=lambda x: -x[1]):
        print(f"    {g}: {c}")
    print(f"\n  By Type:")
    for t, c in sorted(types.items(), key=lambda x: -x[1]):
        print(f"    {t}: {c}")
    if price_range["min"] < float("inf"):
        print(f"\n  Price Range: MMK {price_range['min']:,} — MMK {price_range['max']:,}")
    print(f"\n  Top brands:")
    brand_counts = {}
    for p in results:
        if p["brand"]:
            brand_counts[p["brand"]] = brand_counts.get(p["brand"], 0) + 1
    for b, c in sorted(brand_counts.items(), key=lambda x: -x[1])[:20]:
        print(f"    {b}: {c} products")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
