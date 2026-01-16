import json
import time
from pathlib import Path
from typing import Optional

import joblib
import tiktoken
from fastapi import FastAPI, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from diversifix_server.gpt import matches as gpt_matches
from diversifix_server.matches import matches as rule_matches

app = FastAPI(title="DIVERSIFIX API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_tokens(text: str) -> list:
    enc = tiktoken.encoding_for_model("gpt-4-1106-preview")
    return enc.encode(text)


# Static files - mount if directory exists
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/")
@app.get("/{filename:path}")
async def index(filename: Optional[str] = None):
    filename = filename or "index.html"
    file_path = static_dir / filename
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    return FileResponse(static_dir / "index.html")


@app.post("/v2/check")
async def serve_api(
    request: Request,
    text: Optional[str] = Form(None),
    aiModel: Optional[str] = Form(None),
):
    if text is None:
        return JSONResponse({"error": "No input text."}, status_code=500)

    if aiModel in ["gpt-4-1106-preview", "gpt-3.5-turbo"]:
        match_results = gpt_matches(text, model=aiModel)
    else:
        # Use rule-based matching (Stanza NLP + rules dictionary)
        match_results = rule_matches(text)

    log_data = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        "user_ip_hash": joblib.hash(request.client.host if request.client else "unknown"),
        "text_length": {
            "characters": len(text),
            "words": len(text.split()),
            "paragraphs": len(text.split("\n\n")),
            "tokens": len(get_tokens(text)),
        },
        "num_matches": len(match_results),
    }

    with open("requests.log", "a") as file:
        file.write(json.dumps(log_data) + "\n")

    return {"matches": match_results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("diversifix_server.app:app", host="localhost", port=8081, reload=True)
