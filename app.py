from flask import Flask, render_template, request, jsonify
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
import faiss
import requests
import xml.etree.ElementTree as ET
import os
import feedparser


app = Flask(__name__)

# Disable tokenizers parallelism warning
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Load PDF and create FAISS index
pdf_path = "/Users/swetha/Downloads/women.pdf"  # Change this if needed
reader = PdfReader(pdf_path)
texts = [page.extract_text() for page in reader.pages if page.extract_text()]

model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = model.encode(texts)

dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(embeddings)

# News feed functions
def get_news_from_rss(category="general"):
    # Dictionary of RSS feeds by category
    rss_feeds = {
        "general": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "crime": "https://timesofindia.indiatimes.com/rssfeeds/-2128821153.cms",  # TOI Crime RSS
        "health": "https://timesofindia.indiatimes.com/rssfeeds/3908999.cms",
        "business": "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms",
                }
    
    # Use default if category not found
    feed_url = rss_feeds.get(category, rss_feeds["general"])
    
    # Parse the feed
    feed = feedparser.parse(feed_url)
    
    articles = []
    for entry in feed.entries[:10]:  # Limit to 10 articles
        # Extract image URL if available
        image_url = None
        if hasattr(entry, 'media_content') and entry.media_content:
            image_url = entry.media_content[0]['url']
        elif hasattr(entry, 'enclosures') and entry.enclosures:
            for enclosure in entry.enclosures:
                if 'image' in enclosure.get('type', ''):
                    image_url = enclosure.get('href')
                    break
                    
        # Create article object
        article = {
            'title': entry.title,
            'description': entry.summary if hasattr(entry, 'summary') else "",
            'link': entry.link,
            'urlToImage': image_url,
            'publishedAt': entry.published if hasattr(entry, 'published') else "",
            'source': {'name': feed.feed.title if hasattr(feed, 'feed') and hasattr(feed.feed, 'title') else "News"}
        }
        articles.append(article)
    
    return articles

# Main routes
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/laws")
def laws():
    return render_template("laws.html")

@app.route("/news")
def news():
    return render_template("news.html")

@app.route('/safety_tips')
def safety_tips():
    return render_template('safety_tips.html')
 
@app.route('/resources')
def resources():
    """Route for support resources page"""
    return render_template('resources.html')

@app.route("/tracker")
def tracker():
    return render_template("tracker.html")

# RAG query endpoint for laws
@app.route("/query", methods=["POST"])
def query_pdf():
    data = request.get_json()
    question = data.get("question")
    if not question:
        return jsonify({"response": "Please enter a valid question."})

    question_embedding = model.encode([question])
    _, idx = index.search(question_embedding, 1)
    
    best_match = texts[idx[0][0]]
    return jsonify({"response": best_match})

# Updated RSS feed endpoints for different news categories
@app.route("/rss/<category>")
def fetch_categorized_news(category):
    try:
        articles = get_news_from_rss(category)
        return jsonify({"articles": articles})
    except Exception as e:
        return jsonify({"error": str(e), "articles": []})

# Emergency contact API (dummy)
@app.route("/api/emergency_contacts")
def emergency_contacts():
    # This would typically come from a database
    contacts = [
        {"name": "Women's Helpline", "number": "1091"},
        {"name": "Police", "number": "100"},
        {"name": "Ambulance", "number": "108"},
        {"name": "Domestic Violence Helpline", "number": "181"}
    ]
    return jsonify({"contacts": contacts})

# Running on all network interfaces (0.0.0.0) instead of just localhost
if __name__ == '__main__':
    app.run(debug=True, port=5001)  # Change 5001 to any available port