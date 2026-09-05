from app.classifier import classify_intent


def test_styling():
    assert classify_intent(
        "What should I wear with my black jeans?"
    ) == "STYLING_ADVICE"


def test_purchase():
    assert classify_intent(
        "Recommend white sneakers under 3000"
    ) == "PURCHASE"


def test_booking():
    assert classify_intent(
        "I want to book a stylist consultation"
    ) == "BOOKING"


def test_wardrobe():
    assert classify_intent(
        "I want to upload my shirt photo"
    ) == "WARDROBE_UPLOAD"