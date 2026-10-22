"""
NIDAAN-X AI Assistant Router
Advanced clinical chatbot powered by Groq (LLaMA 3) with intelligent fallback.
"""
import re
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI

from app.config import settings

router = APIRouter(prefix="/chat", tags=["AI Assistant"])

# Initialize Groq client (OpenAI-compatible)
client = OpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)

# ------------------------------------------------------------------------------
# MODELS
# ------------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's query")
    session_id: Optional[str] = Field(default="default_user", description="Session identifier for memory")

class ChatResponse(BaseModel):
    reply: str
    specimen_analyzed: Optional[str] = None

# ------------------------------------------------------------------------------
# CONSTANTS & STATE
# ------------------------------------------------------------------------------

EXPECTED_PATH = [
    "collection", "labeling", "dispatch", "lab_reception", 
    "processing", "testing", "report_generated"
]

# In-memory session store to remember context
# (In production, use Redis or a database)
SESSION_MEMORY: Dict[str, str] = {}

# ------------------------------------------------------------------------------
# HELPERS: DATA LOADING & ANALYSIS
# ------------------------------------------------------------------------------

def get_dataset() -> dict:
    """Safely loads the synthetic dataset."""
    dataset_file = Path(__file__).parent.parent / "data" / "synthetic_dataset.json"
    if not dataset_file.exists():
        return {"specimens": []}
    try:
        return json.loads(dataset_file.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"❌ Error loading dataset: {e}")
        return {"specimens": []}

def extract_specimen_id(text: str) -> Optional[str]:
    """Extracts a Specimen ID (e.g., S-2026-1000 or S-REAL-121) from text."""
    match = re.search(r'S-[A-Z0-9-]+', text, re.IGNORECASE)
    return match.group(0).upper() if match else None

def analyze_specimen_data(sid: str) -> Optional[Dict[str, Any]]:
    """Fetches and deeply analyzes a specimen's journey."""
    data = get_dataset()
    
    for spec in data.get("specimens", []):
        if spec["specimen_id"] == sid:
            events = spec.get("events", [])
            actual_stages = [e["activity"] for e in events]
            missing_stages = [s for s in EXPECTED_PATH if s not in actual_stages]
            
            # Calculate journey timeline and delays
            timeline = []
            for i, e in enumerate(events):
                stage_info = f"- {e['activity']} at {e['timestamp']} ({e['location']})"
                if i > 0:
                    # Simple time delta calculation for display
                    try:
                        t1 = datetime.fromisoformat(events[i-1]["timestamp"])
                        t2 = datetime.fromisoformat(e["timestamp"])
                        delta_mins = int((t2 - t1).total_seconds() / 60)
                        stage_info += f" [+{delta_mins}m]"
                    except:
                        pass
                timeline.append(stage_info)
                
            return {
                "id": sid,
                "sample_type": spec.get("sample_type", "Unknown"),
                "test_type": spec.get("test_type", "Unknown"),
                "location": spec.get("collection_location", "Unknown"),
                "actual_stages": actual_stages,
                "missing_stages": missing_stages,
                "timeline": timeline,
                "is_normal": len(missing_stages) == 0
            }
    return None

def build_clinical_context(analysis: Dict[str, Any]) -> str:
    """Formats the analysis into a clinical string for the LLM."""
    context = f"--- CLINICAL REPORT FOR {analysis['id']} ---\n"
    context += f"Type: {analysis['sample_type']} | Test: {analysis['test_type']}\n"
    context += f"Location: {analysis['location']}\n"
    context += "Timeline:\n" + "\n".join(analysis['timeline']) + "\n"
    
    if analysis['is_normal']:
        context += "STATUS: ✅ NORMAL. All expected stages completed.\n"
    else:
        context += f"STATUS: ⚠️ CRITICAL ANOMALY. Missing stages: {', '.join(analysis['missing_stages'])}\n"
    
    return context

def safe_math_eval(text: str) -> Optional[str]:
    """Evaluates basic math only if it's NOT a specimen ID."""
    # If it looks like a specimen ID, refuse to do math
    if extract_specimen_id(text):
        return None
        
    clean_text = re.sub(r'[^0-9+\-*/().\s]', '', text)
    if not clean_text.strip() or not re.search(r'[\+\-\*\/]', clean_text):
        return None
        
    try:
        # Avoid eval security risks by restricting characters
        if len(clean_text) < 20:
            return str(eval(clean_text))
    except:
        pass
    return None

# ------------------------------------------------------------------------------
# THE SMART FALLBACK (Offline Mode)
# ------------------------------------------------------------------------------

def generate_fallback(req: ChatRequest, analysis: Optional[Dict], math_res: Optional[str]) -> str:
    """If the Groq API fails, this ensures the bot still works flawlessly."""
    msg_lower = req.message.lower()
    
    # 1. Specimen Analysis
    if analysis:
        sid = analysis['id']
        if analysis['is_normal']:
            return (
                f"Analysis for {sid}:\n✅ NORMAL JOURNEY.\n"
                f"This {analysis['sample_type']} sample completed all stages (Collection through Report) "
                f"with no missing handoffs. Current location: {analysis['location']}."
            )
        else:
            missing = ", ".join(analysis['missing_stages'])
            return (
                f"Analysis for {sid}:\n⚠️ CRITICAL ANOMALY DETECTED.\n"
                f"This specimen is missing the following stages: **{missing}**. "
                f"The sample is currently stuck at {analysis['actual_stages'][-1]}. "
                f"Immediate supervisor intervention required."
            )
            
    # 2. Identity & Greetings
    if "who are you" in msg_lower or "what are you" in msg_lower:
        return "I am NIDAAN-X AI, an advanced clinical assistant built to analyze diagnostic specimen journeys, detect bottlenecks, and answer your questions."
    if any(w in msg_lower for w in ["hi", "hello", "hey"]):
        return "Hello! I am NIDAAN-X AI. Ask me to analyze a Specimen ID (e.g., 'Tell me about S-2026-1047') or ask me a general question."

    # 3. Math
    if math_res is not None:
        return f"The answer to your equation is {math_res}. How else can I assist you with NIDAAN-X?"

    # 4. Default
    return (
        "I am currently operating in offline fallback mode. I can analyze specimen IDs "
        "(e.g., 'S-2026-1004') or answer basic math questions."
    )

# ------------------------------------------------------------------------------
# MAIN ENDPOINT
# ------------------------------------------------------------------------------

@router.post("/", response_model=ChatResponse)
async def chat_with_grok(req: ChatRequest):
    # 1. Handle Context Memory
    sid_from_text = extract_specimen_id(req.message)
    
    # If no ID in the message, check if we are following up on a previous ID
    if not sid_from_text and req.session_id in SESSION_MEMORY:
        if any(w in req.message.lower() for w in ["it", "this", "that", "specimen", "sample", "report"]):
            sid_from_text = SESSION_MEMORY[req.session_id]
            
    # Save to memory
    if sid_from_text:
        SESSION_MEMORY[req.session_id] = sid_from_text

    # 2. Extract Data & Math
    analysis = analyze_specimen_data(sid_from_text) if sid_from_text else None
    math_res = safe_math_eval(req.message)
    
    # 3. Build System Prompt
    system_prompt = (
        "You are NIDAAN-X AI, a highly intelligent, clinical-grade AI assistant. "
        "RULES:\n"
        "1. You are conversational. Greet the user normally if they say hi.\n"
        "2. If the user asks a math question (e.g., '1+2'), answer it directly.\n"
        "3. If the user provides a Specimen ID, you MUST analyze the Clinical Report provided. "
        "   If the report says 'CRITICAL ANOMALY', explain what stages are missing and warn them. "
        "   If the report says 'NORMAL', reassure them that the journey is perfect.\n"
        "4. Be concise, professional, and helpful. Format with bullet points or bold text where appropriate."
    )
    
    if analysis:
        system_prompt += f"\n\n{build_clinical_context(analysis)}"

    # 4. Call the LLM (Groq)
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ],
            temperature=0.3,
            max_tokens=250,
        )
        
        # Strip out any weird formatting and return
        reply_text = response.choices[0].message.content.strip()
        return ChatResponse(reply=reply_text, specimen_analyzed=sid_from_text)

    except Exception as e:
        print(f"⚠️ Groq API Error (Switching to Fallback): {e}")
        
        # 5. Fallback Mode
        fallback_reply = generate_fallback(req, analysis, math_res)
        return ChatResponse(reply=fallback_reply, specimen_analyzed=sid_from_text)