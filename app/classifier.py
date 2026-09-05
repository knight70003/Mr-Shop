INTENTS = {
    "WARDROBE_UPLOAD": [
        "upload",
        "clothes",
        "clothing",
        "wardrobe",
        "shirt photo",
        "pants photo",
        "add clothes"
    ],

    "STYLING_ADVICE": [
        "outfit",
        "style",
        "styling",
        "wear",
        "what should i wear",
        "match",
        "look",
        "dress"
    ],

    "PURCHASE": [
        "buy",
        "purchase",
        "shop",
        "price",
        "cost",
        "recommend",
        "recommendation",
        "available",
        "order"
    ],

    "BOOKING": [
        "book",
        "booking",
        "appointment",
        "stylist",
        "consultation",
        "colour analyst",
        "color analyst"
    ]
}


def classify_intent(message: str) -> str:
    """
    Classify a user message into one of the supported intents.
    """

    message = message.lower().strip()

    scores = {}

    for intent, keywords in INTENTS.items():
        score = 0

        for keyword in keywords:
            if keyword in message:
                score += 1

        scores[intent] = score

    best_intent = max(scores, key=scores.get)

    # No keyword matched
    if scores[best_intent] == 0:
        return "UNKNOWN"

    return best_intent