from fastapi import APIRouter, Depends, HTTPException, Body, Header
from pydantic import BaseModel
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from ...infrastructure.database import get_db
from ...infrastructure.models import Conversation, Message, User
from ...infrastructure.security import decode_access_token
from ...use_cases.agent_service import AgentService

router = APIRouter(prefix="/ai", tags=["ai"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    messages: List[ChatMessage]
    mode: str = "offensive" 

class ChatResponse(BaseModel):
    response: str
    conversation_id: int
    title: Optional[str] = None

class ConversationSummary(BaseModel):
    id: int
    title: str
    updated_at: datetime
    last_message: Optional[str] = None

    class Config:
        orm_mode = True

class ConversationDetail(BaseModel):
    id: int
    title: str
    messages: List[ChatMessage]

    class Config:
        orm_mode = True

def get_agent_service():
    return AgentService()

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    """Extract and validate user ID from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if not payload or "id" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return int(payload["id"])

@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db),
    service: AgentService = Depends(get_agent_service),
    user_id: int = Depends(get_current_user_id)
):
    try:
        
        # 1. Get or Create Conversation
        if request.conversation_id:
            conversation = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            # Create new
            initial_title = request.messages[0].content[:30] + "..." if request.messages else "New Chat"
            conversation = Conversation(user_id=user_id, title=initial_title)
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # 2. Save User Message (The last one sent)
        last_user_msg_data = request.messages[-1] 
        user_msg = Message(
            conversation_id=conversation.id,
            role="user",
            content=last_user_msg_data.content
        )
        db.add(user_msg)
        
        # 3. Get AI Response (Sending full context to Ollama)
        # We assume request.messages contains the FULL client-side history for now to keep state simple,
        # OR we could reconstruct it from DB. Let's trust the client context for the prompt generation 
        # but save to DB for persistence.
        messages_dict = [{"role": m.role, "content": m.content} for m in request.messages]
        
        # Fetch user plan (default to Basic if not found)
        user = db.query(User).filter(User.id == user_id).first()
        user_plan = user.plan_tier if user else "Basic"
        user_name = user.first_name if user and user.first_name else "User"
        
        response_content = service.get_ai_response(messages_dict, request.mode, user_plan, user_name)

        # 4. Save AI Response
        ai_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=response_content
        )
        db.add(ai_msg)
        
        # Update conversation timestamp
        conversation.updated_at = datetime.utcnow()
        db.commit()

        # 5. Generate Title if it's the first message and default title
        new_title = None
        if len(request.messages) == 1:
             try:
                new_title = service.generate_title(request.messages[0].content)
                conversation.title = new_title.replace('"', '').strip()
                db.commit()
             except:
                 pass

        return {
            "response": response_content,
            "conversation_id": conversation.id,
            "title": new_title or conversation.title
        }

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations", response_model=List[ConversationSummary])
def list_conversations(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    conversations = db.query(Conversation).filter(Conversation.user_id == user_id).order_by(Conversation.updated_at.desc()).all()
    return conversations

@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation(conversation_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get messages
    msgs = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.id.asc()).all()
    
    return {
        "id": conversation.id,
        "title": conversation.title,
        "messages": [{"role": m.role, "content": m.content} for m in msgs]
    }

@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete messages first (cascade usually handles this but being explicit)
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.delete(conversation)
    db.commit()
    return {"status": "success"}

@router.patch("/conversations/{conversation_id}")
def update_conversation_title(
    conversation_id: int, 
    title: str = Body(..., embed=True), 
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.title = title
    db.commit()
    return {"status": "success", "title": title}
