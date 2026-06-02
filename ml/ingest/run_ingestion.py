#runs full ingestion pipeline for all sources in data/sources.json
import json
import os

from ingest.scraper import scrape_urls
from ingest.chunker import chunk_all
from ingest.embedder import embed_chunks
from ingest.pinecone_upload import upload

SOURCES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "sources.json")


def load_sources() -> dict:
    with open(SOURCES_PATH, "r") as f:
        return json.load(f)


def run():
    sources = load_sources()
    total_technologies = len(sources)

    print(f"Starting ingestion for {total_technologies} technologies...\n")

    for i, (technology, urls) in enumerate(sources.items(), start=1):
        print(f"[{i}/{total_technologies}] {technology}")

        print(f"  Scraping {len(urls)} URL(s)...")
        scraped = scrape_urls(urls)
        if not scraped:
            print(f"  No pages scraped for {technology}, skipping.\n")
            continue

        print(f"  Chunking...")
        chunks = chunk_all(scraped, technology)
        print(f"  {len(chunks)} chunks created.")

        print(f"  Embedding...")
        chunks = embed_chunks(chunks)

        print(f"  Uploading to Pinecone...")
        upload(chunks)

        print(f"  Done.\n")

    print("Ingestion complete.")


if __name__ == "__main__":
    run()
