from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import yt_dlp
import os
import subprocess
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOWNLOAD_DIR = os.path.join(BASE_DIR, "downloads")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

os.makedirs(DOWNLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Serve separated files
app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")

class SearchRequest(BaseModel):
    query: str

@app.get("/api/search")
async def search_youtube(q: str):
    logger.info(f"Searching for: {q}")
    ydl_opts = {
        'quiet': True,
        'extract_flat': True,
        'force_generic_extractor': True,
        'skip_download': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Search for top 10 entries
            info = ydl.extract_info(f"ytsearch10:{q}", download=False)
            results = []
            for entry in info.get('entries', []):
                if not entry: continue
                results.append({
                    "id": entry.get("id"),
                    "title": entry.get("title"),
                    "artist": entry.get("uploader", "YouTube")
                })
            return results
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class ExtractRequest(BaseModel):
    url: str

@app.post("/api/extract")
async def extract_audio(request: ExtractRequest):
    url = request.url
    logger.info(f"Processing URL: {url}")
    
    # 1. Download from YouTube using yt-dlp
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(DOWNLOAD_DIR, '%(id)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            video_id = info['id']
            title = info.get('title', 'Unknown Song')
            artist = info.get('uploader', 'Unknown Artist')
            mp3_path = os.path.join(DOWNLOAD_DIR, f"{video_id}.mp3")
            
            logger.info(f"Downloaded: {title}")
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"YouTube 다운로드 실패: {str(e)}")

    # 2. Separate tracks using Spleeter
    try:
        logger.info(f"Starting separation for: {video_id}")
        # Run spleeter as a subprocess
        # -p spleeter:4stems means separate into vocals, drums, bass, other
        subprocess.run([
            "spleeter", "separate",
            "-p", "spleeter:4stems",
            "-o", OUTPUT_DIR,
            mp3_path
        ], check=True)
        logger.info(f"Separation completed for: {video_id}")
    except Exception as e:
        logger.error(f"Spleeter error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"음원 분리 실패 (Spleeter): {str(e)}")

    # 3. Construct URLs for the frontend
    # Note: Spleeter creates a folder named after the input file (video_id)
    base_url = "http://localhost:8000/output"
    stem_path = f"{base_url}/{video_id}"
    
    return {
        "title": title,
        "artist": artist,
        "bpm": 120, # Default or we could use a bpm detector like librosa
        "stems": [
            {"id": "drums", "url": f"{stem_path}/drums.wav"},
            {"id": "bass", "url": f"{stem_path}/bass.wav"},
            {"id": "vocals", "url": f"{stem_path}/vocals.wav"},
            {"id": "other", "url": f"{stem_path}/other.wav"},
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
