from app.classifier import classify_intent
from app.memory import ConversationMemory
from app.llm import LLMService


class ConversationRouter:

    def __init__(self):
        self.memory = ConversationMemory()
        self.llm = LLMService()

    def process_message(self, message: str):

        # 1. Detect intent
        intent = classify_intent(message)

        # 2. Update memory
        self.memory.update(message, intent)

        # 3. Get conversation context
        context = self.memory.get_context()

        # 4. Generate response
        response = self.llm.generate_response(
            message,
            intent,
            context
        )

        return {
            "intent": intent,
            "response": response,
            "context": context
        }
        