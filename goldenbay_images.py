import os
import time
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Configuration
URL = "https://goldenbay.com.ph/vip-rooms/"
SAVE_FOLDER = "goldenbay_vip_images"

def setup_driver():
    options = Options()
    # options.add_argument("--headless")  # Uncomment to run in background
    options.add_argument("--window-size=1920,1080")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    return webdriver.Chrome(options=options)

def download_image(url, folder):
    if not url:
        return
    try:
        if not os.path.exists(folder):
            os.makedirs(folder)

        filename = os.path.join(folder, url.split("/")[-1].split("?")[0])
        
        # Don't download if exists
        if os.path.exists(filename):
            print(f"Skipping (exists): {filename}")
            return

        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        if response.status_code == 200:
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"Downloaded: {filename}")
        else:
            print(f"Failed to download {url} - Status: {response.status_code}")
    except Exception as e:
        print(f"Error downloading {url}: {e}")

def main():
    driver = setup_driver()
    image_urls = set()

    try:
        print(f"Opening {URL}...")
        driver.get(URL)

        # Wait for the gallery items to load
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "e-gallery-item"))
            )
        except:
            print("Timeout waiting for gallery. Page might be different or slow.")

        # Scroll to bottom to trigger any lazy loading
        print("Scrolling to load images...")
        last_height = driver.execute_script("return document.body.scrollHeight")
        while True:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
        
        # --- STRATEGY 1: Elementor Gallery Items (High Res) ---
        print("Scanning Elementor Gallery items...")
        gallery_items = driver.find_elements(By.CSS_SELECTOR, "a.e-gallery-item")
        
        for item in gallery_items:
            # The 'href' in the anchor tag usually points to the full resolution image in Elementor
            img_url = item.get_attribute("href")
            if img_url and any(ext in img_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                image_urls.add(img_url)

        # --- STRATEGY 2: Fallback to standard images if Strategy 1 fails ---
        if len(image_urls) == 0:
            print("No gallery items found, trying standard images...")
            images = driver.find_elements(By.TAG_NAME, "img")
            for img in images:
                src = img.get_attribute("src")
                # Filter out small icons or SVGs if necessary
                if src and "logo" not in src and any(ext in src.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                    image_urls.add(src)

        print(f"Found {len(image_urls)} unique images.")

        # Download found images
        for url in image_urls:
            download_image(url, SAVE_FOLDER)

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        driver.quit()
        print("Done!")

if __name__ == "__main__":
    main()