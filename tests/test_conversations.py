from app.router import ConversationRouter


def test_styling_conversation():

    router = ConversationRouter()

    result = router.process_message(
        "I have black jeans. What should I wear with them?"
    )

    assert result["intent"] == "STYLING_ADVICE"
    assert "jeans" in result["context"]["wardrobe"]


def test_purchase_conversation():

    router = ConversationRouter()

    result = router.process_message(
        "Recommend white sneakers under 3000"
    )

    assert result["intent"] == "PURCHASE"
    assert result["context"]["budget"] == 3000


def test_wardrobe_conversation():

    router = ConversationRouter()

    result = router.process_message(
        "I want to upload a photo of my shirt"
    )

    assert result["intent"] == "WARDROBE_UPLOAD"


def test_booking_conversation():

    router = ConversationRouter()

    result = router.process_message(
        "I want to book a stylist consultation"
    )

    assert result["intent"] == "BOOKING"


def test_topic_switch():

    router = ConversationRouter()

    first = router.process_message(
        "I have black jeans. Suggest an outfit."
    )

    second = router.process_message(
        "Now recommend white sneakers under 3000."
    )

    assert first["intent"] == "STYLING_ADVICE"
    assert second["intent"] == "PURCHASE"

    # Previous context is retained
    assert "jeans" in second["context"]["wardrobe"]
    assert second["context"]["budget"] == 3000
    