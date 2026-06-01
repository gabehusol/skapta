from langchain_text_splitters import RecursiveCharacterTextSplitter

#Create the text splitter and return it
def make_splitter() -> RecursiveCharacterTextSplitter:
    return RecursiveCharacterTextSplitter( chunk_size=2000, chunk_overlap=256)

#Splits one pages text into chunks with metadata attatched, list of dicts
def chunk_document(text: str, url: str, technology: str) -> list[dict]:
    splitter = make_splitter()
    chunks = splitter.split_text(text)
    result = []
    for chunk_index, chunk_text in enumerate(chunks):
        result.append({
            "text": chunk_text,
            "url": url,
            "technology": technology,
            "chunk_index": chunk_index,
        })
    return result

#chunks all scraped pages for diff tech in stack and stores the results for better context
def chunk_all(scraped: list[dict], technology: str) -> list[dict]:
    results = []
    for item in scraped:
        chunks = chunk_document(item["text"], item["url"], technology)
        results.extend(chunks)
    return results
