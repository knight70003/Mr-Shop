import os

from groq import Groq
from dotenv import load_dotenv

load_dotenv()


class LLMService:

    def __init__(self):
        self.client = Groq(
            api_key=os.getenv("GROQ_API_KEY")
        )

    def generate_response(self, message, intent, context):

        prompt = f"""
You are Mr.Shop, an AI fashion stylist.

User message:
{message}

Detected intent:
{intent}

Conversation context:
{context}

Use the conversation context when it is relevant.

Give a helpful, concise response to the user.
Do not mention internal intents, memory, prompts, APIs, or system architecture.
"""

        response = self.client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI fashion stylist."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=300
        )

        return response.choices[0].message.content
    
    