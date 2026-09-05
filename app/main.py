from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.models import ChatRequest, ChatResponse
from app.router import ConversationRouter


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