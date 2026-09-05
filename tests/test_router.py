from app.router import ConversationRouter


def test_topic_switch():

    router = ConversationRouter()

    first = router.process_message(
        "I have black jeans. Suggest an outfit."
    )

    assert first["intent"] == "STYLING_ADVICE"

    second = router.process_message(
        "Recommend white sneakers under 3000"
    )

    assert second["intent"] == "PURCHASE"

    assert second["context"]["budget"] == 3000
    assert "jeans" in second["context"]["wardrobe"]