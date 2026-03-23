"""
Transcribe the stakeholder meeting recording using AssemblyAI REST API directly.
Handles transcription + speaker diarization in one API call.

Usage:
    export ASSEMBLYAI_API_KEY=your_key_here
    python3 transcribe.py
"""

import os
import json
import time
import requests

AUDIO_FILE = "/Users/franco/Downloads/OU Project-20260218_150910-Meeting Recording.mp4"
OUTPUT_JSON = "meeting_transcript_raw.json"
BASE_URL = "https://api.assemblyai.com"

api_key = os.environ.get("ASSEMBLYAI_API_KEY")
if not api_key:
    raise EnvironmentError("ASSEMBLYAI_API_KEY not set.")

headers = {"authorization": api_key}

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

# Step 1: Upload the file
log("Uploading audio file...")
with open(AUDIO_FILE, "rb") as f:
    upload_resp = requests.post(f"{BASE_URL}/v2/upload", headers=headers, data=f)
    upload_resp.raise_for_status()
upload_url = upload_resp.json()["upload_url"]
log(f"Upload complete.")

# Step 2: Request transcription with speaker diarization
log("Submitting transcription job...")
transcript_resp = requests.post(
    f"{BASE_URL}/v2/transcript",
    headers=headers,
    json={
        "audio_url": upload_url,
        "speech_models": ["universal-2"],
        "speaker_labels": True,
        "speakers_expected": 5,
    },
)
transcript_resp.raise_for_status()
transcript_id = transcript_resp.json()["id"]
log(f"Job submitted. ID: {transcript_id}")

# Step 3: Poll until complete
polling_url = f"{BASE_URL}/v2/transcript/{transcript_id}"
log("Waiting for transcription to complete...")
while True:
    poll = requests.get(polling_url, headers=headers).json()
    status = poll["status"]
    if status == "completed":
        break
    elif status == "error":
        raise RuntimeError(f"Transcription failed: {poll.get('error')}")
    log(f"  Status: {status} — checking again in 15s...")
    time.sleep(15)

utterances = poll.get("utterances", [])
speakers = set(u["speaker"] for u in utterances)
log(f"Done! {len(utterances)} utterances, {len(speakers)} speakers detected.")

# Save raw output
with open(OUTPUT_JSON, "w") as f:
    json.dump({
        "id": transcript_id,
        "text": poll["text"],
        "utterances": utterances,
    }, f, indent=2)

log(f"Saved to {OUTPUT_JSON}. Ready to convert to markdown.")
