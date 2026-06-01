import time
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Skapta-Bot/1.0)"
}

#Grabs the text on a 200 req, if not throws error, returns none
def fetch_page(url: str) -> str | None:
    try: 
        response = requests.get(url=url, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            return(response.text)
        else:
            print(f"Bad status {response.status_code} for {url}")
            return None    
    except requests.exceptions.RequestException as e:
        print(f"Network error for {url}: {e}")
        return None
        
#Parse the text we grabbed earlier with beautifulSoup
def extract_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    tags_to_remove = ["script", "style", "nav", "footer", "header"]
    for tag in tags_to_remove:
        for element in soup.find_all(tag):
            element.decompose()

    text = soup.get_text(separator=" ")
    return text.strip() 
    
#Scrape multiple URLs with a 1s rate limit
def scrape_urls(urls: list[str]) -> list[dict]:
    results = []

    for url in urls:
        html = fetch_page(url)
        if html is None:
            continue 
        text = extract_text(html)
        results.append({
            "url": url,
            "text": text
        })
        
        time.sleep(1) #rate limit in seconds

    return results