import re


class ConversationMemory:

    def __init__(self):
        self.data = {
            "preferences": {},
            "wardrobe": [],
            "budget": None,
            "conversation_history": []
        }

    def update(self, user_message, intent):

        self.data["conversation_history"].append({
            "message": user_message,
            "intent": intent
        })

        self._extract_context(user_message)

    def _extract_context(self, message):

        text = message.lower()

        # ---------------------------------
        # Color preference
        # ---------------------------------

        colors = [
            "black",
            "white",
            "blue",
            "red",
            "green",
            "brown",
            "grey",
            "gray",
            "beige",
            "navy"
        ]

        for color in colors:
            if color in text:
                self.data["preferences"]["color"] = color
                break

        # ---------------------------------
        # Wardrobe items
        # ---------------------------------

        clothing_items = [
            "jeans",
            "shirt",
            "t-shirt",
            "trousers",
            "pants",
            "shoes",
            "sneakers",
            "jacket",
            "hoodie",
            "sweater",
            "shorts",
            "dress"
        ]

        for item in clothing_items:

            if item in text and item not in self.data["wardrobe"]:
                self.data["wardrobe"].append(item)

        # ---------------------------------
        # Budget
        # ---------------------------------

        budget_match = re.search(
            r"(?:₹|rs\.?|inr)?\s*(\d{3,6})",
            text
        )

        if budget_match:
            self.data["budget"] = int(
                budget_match.group(1)
            )

    def get_context(self):

        return self.data