
import os
import subprocess
import uuid
import re
from flask import Flask, request, send_file, jsonify, after_this_response
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
CORS(app)

# Ensure temp directory exists
DOWNLOAD_FOLDER = "temp_clips"
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

def get_video_stream_url(youtube_url):
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'quiet': True,
        'no_warnings': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=False)
        return info['url']

def sanitize_timestamp(ts):
    # Support MM:SS or seconds
    if ':' in str(ts):
        parts = ts.split(':')
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    return ts

@app.route('/download', methods=['POST'])
def download_segment():
    data = request.json
    video_url = data.get('url')
    start_time = sanitize_timestamp(data.get('start_time', '0'))
    end_time = sanitize_timestamp(data.get('end_time', '10'))
    
    if not video_url:
        return jsonify({"error": "No URL provided"}), 400

    try:
        # 1. Get Direct Stream URL
        stream_url = get_video_stream_url(video_url)
        
        # 2. Prepare Output Path
        filename = f"clip_{uuid.uuid4().hex}.mp4"
        output_path = os.path.join(DOWNLOAD_FOLDER, filename)
        
        # 3. FFmpeg Command (Crucial: -ss before -i for fast seeking)
        # Use -c:v libx264 -c:a aac for frame accuracy and browser compatibility
        command = [
            "ffmpeg",
            "-ss", str(start_time),
            "-to", str(end_time),
            "-i", stream_url,
            "-c:v", "libx264",
            "-c:a", "aac",
            "-strict", "experimental",
            "-preset", "veryfast",
            "-y",
            output_path
        ]
        
        # Execute subprocess
        process = subprocess.run(command, capture_output=True, text=True)
        
        if process.returncode != 0:
            print(f"FFmpeg error: {process.stderr}")
            return jsonify({"error": "FFmpeg processing failed"}), 500

        # 4. Schedule deletion after sending
        @after_this_response
        def remove_file(response):
            try:
                os.remove(output_path)
            except Exception as e:
                print(f"Error removing file: {e}")

        # Serve the Vite built frontend
@app.route('/')
def index():
    return send_file('dist/index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_file(f'dist/{path}')
            return response

        # 5. Send File
        return send_file(output_path, as_attachment=True, download_name="youtube_clip.mp4")

    except Exception as e:
        print(f"Server Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Instructions: Ensure ffmpeg is in system PATH
    print("Starting Clipper Backend on port 5000...")
    app.run(host="0.0.0.0", debug=True, port=int(os.environ.get("PORT", 7860)))
