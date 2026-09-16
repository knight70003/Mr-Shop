from pathlib import Path
from fastapi import Form
from fastapi import FastAPI,UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.models import ChatRequest, ChatResponse, ImageAnalysisResponse
from app.router import ConversationRouter
import os
from dotenv import load_dotenv
load_dotenv()
from groq import Groq
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="Mr.Shop Conversation Layer",
    description="Conversational Intelligence and Ambient Context Prototype",
    version="1.0.0"
)


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"


# =========================================================
# FRONTEND STATIC FILES
# =========================================================

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)


# =========================================================
# CONVERSATION ENGINE
# =========================================================

conversation_router = ConversationRouter()


# =========================================================
# FRONTEND
# =========================================================

@app.get("/", include_in_schema=False)
def serve_frontend():
    return FileResponse(
        FRONTEND_DIR / "index.html"
    )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Mr.Shop"
    }


# =========================================================
# CHAT API
# =========================================================

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    return conversation_router.process_message(
        request.message
    )
    
@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...),message: str = Form(...)):
    image_bytes = await file.read()

    # Convert image to base64
    import base64

    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    response = client.chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"""
                        You are ClosetAI, an AI wardrobe assistant.
                        Analyze the clothing image and answer the user's request based specifically on what is visible in the image.
                        User request:{message}
                        First identify the clothing item in the image.
                        Then answer the user's request specifically for that item.
                        For example, if the image shows a coat and the user asks:
                        "Suggest me pants according to this image"
                        Then recommend pants that match THIS coat's color, style, and pattern.
                        Return ONLY valid JSON with these fields:
                        category
                        color
                        pattern
                        occasion
                        season
                        suggested_outfit
                    The suggested_outfit must directly answer the user's request.
                    Do not include markdown or explanation."""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{file.content_type};base64,{image_base64}"
                        }
                    }
                ]
            }
        ],
        response_format={"type": "json_object"}
    )

    return response.choices[0].message.content