import requests
import json
from typing import List, Optional, Dict
from ..domain.models import Agent

class AgentService:
    """
    Application Business Rules for Agent Management and AI Chat.
    """
    def __init__(self):
        # In a real app, inject a repository here
        self._agents: List[Agent] = []
        self.ollama_url = "http://localhost:11434/api/chat"
        # Using a default model that is likely to exist or fallback
        self.model = "llama3" 

    def create_agent(self, name: str, target: str) -> Agent:
        # TODO: Implement ID generation and persistence
        return Agent(id="temp-id", name=name, target=target, status="queued")

    def get_agents(self) -> List[Agent]:
        return self._agents

    def get_ai_response(self, messages: List[Dict[str, str]], mode: str = "offensive", user_plan: str = "Basic", user_name: str = "User") -> str:
        """
        Get response from Ollama based on the conversation history and mode.
        Mode: 'offensive' or 'defensive'
        """
        system_prompt = self._get_system_prompt(mode, user_plan, user_name)
        
        # Prepend system prompt if not present or just ensure it's the context
        # Ollama handles system messages well in the messages list
        full_messages = [{"role": "system", "content": system_prompt}] + messages

        try:
            payload = {
                "model": "llama3:8b-instruct-q4_K_M", # Matching user's installed model tag
                "messages": full_messages,
                "stream": False,
                "options": {
                    "temperature": 0.7
                }
            }
            
            # Try specific model first, fallback to generic if fails? 
            # For now, let's use a try/except block to handle model not found if needed,
            # but usually it pulls or errors. let's stick to the one in reference.
            
            response = requests.post(self.ollama_url, json=payload, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            return result.get("message", {}).get("content", "Error: No content received from AI.")
            
        except requests.exceptions.ConnectionError:
            return "Error: Could not connect to Ollama. Is it running on port 11434?"
        except Exception as e:
            print(f"AI Error: {e}")
            return f"Error: Failed to get AI response. {str(e)}"

    def generate_title(self, content: str) -> str:
        """
        Generate a concise 3-5 word title for a conversation based on the first user message.
        """
        prompt = f"Summarize the following message into a concise, professional 3-5 word title for a chat history. Do not use quotes, prefixes like 'Title:', or punctuation. Message: {content}"
        
        try:
            payload = {
                "model": "llama3:8b-instruct-q4_K_M",
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "options": {
                    "temperature": 0.5 # Lower temperature for deterministic titles
                }
            }
            
            response = requests.post(self.ollama_url, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            title = result.get("message", {}).get("content", "New Conversation").strip()
            # Cleanup incase model chats too much
            return title.replace('"', '').replace("Here is a title:", "").strip()
            
        except Exception as e:
            print(f"Title Gen Error: {e}")
            return "New Chat"

    def _get_system_prompt(self, mode: str, user_plan: str, user_name: str) -> str:
        base_identity = f"""You are DracoAI, a cybersecurity expert built into Dracosec. You're talking to {user_name} ({user_plan} plan).

Keep it natural:
- Respond like a knowledgeable colleague, not a manual or sales pitch
- Don't dump feature lists unless asked
- Match the user's energy (casual question = casual answer)
- Use their name occasionally, but don't overdo it

What you know:
- **Where you are**: Inside the Dracosec platform
- **Who made you**: DracoSec Team (elite cybersecurity researchers)
- **What Dracosec has**:
  - Defensive: Phishing sims, vuln scans, Suricata monitoring
  - Offensive: AI pentesting (that's you)

Your job:
- Help with security tasks
- Be practical, not preachy
- Provide analysis and commands (don't execute yourself)
"""

        if mode == 'offensive':
            return base_identity + """
Mode: Offensive (Pentesting)
- Analyze targets for vulnerabilities
- Suggest attack vectors and PoCs
- Stay focused on what the user asks
"""
        else:
            return base_identity + """
Mode: Defensive
- Help with log analysis and hardening
- Suggest remediation strategies
- Assist with phishing campaigns and monitoring
"""
