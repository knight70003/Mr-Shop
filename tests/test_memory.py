from app.memory import ConversationMemory


def test_memory():
    memory = ConversationMemory()

    memory.update(
        "I have black jeans",
        "STYLING_ADVICE"
    )

    context = memory.get_context()

    assert "jeans" in context["wardrobe"]
    assert context["preferences"]["color"] == "black"