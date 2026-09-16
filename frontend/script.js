/* =========================================================
   MR.SHOP — FRONTEND APPLICATION
   Production-ready conversational interface
   ========================================================= */

const API_URL = "/chat";

let conversationStarted = false;
let isLoading = false;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("sendButton");

const intentBadge = document.getElementById("intentBadge");
const wardrobeList = document.getElementById("wardrobeList");
const wardrobeCount = document.getElementById("wardrobeCount");

const colorPreference = document.getElementById("colorPreference");
const budgetValue = document.getElementById("budgetValue");


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

    if (isLoading) {
        return;
    }

    const message = messageInput.value.trim();

    if (!message) {
        return;
    }

    /* -----------------------------------------
       Start conversation
    ----------------------------------------- */

    if (!conversationStarted) {

        conversationStarted = true;

        const welcome = document.getElementById("welcomeState");

        if (welcome) {
            welcome.style.display = "none";
        }
    }

    /* -----------------------------------------
       Add user message
    ----------------------------------------- */

    addMessage(message, "user");
    messageInput.value = "";

    autoResizeTextarea();
    setLoading(true);

    /* -----------------------------------------
       AI typing indicator
    ----------------------------------------- */

    const typingElement = addTypingIndicator();

    try {

        let response;

        /* -----------------------------------------
           IMAGE + MESSAGE
        ----------------------------------------- */

        if (selectedImageFile) {

            const formData = new FormData();

            formData.append("file", selectedImageFile);
            formData.append("message", message);

            response = await fetch(
                "http://127.0.0.1:8000/analyze-image",
                {
                    method: "POST",
                    body: formData
                }
            );

        }

        /* -----------------------------------------
           TEXT ONLY
        ----------------------------------------- */

        else {

            response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message
                })

            });

        }

        /* -----------------------------------------
           HTTP ERROR
        ----------------------------------------- */

        if (!response.ok) {

            let errorMessage =
                `Server error (${response.status})`;

            try {

                const errorData =
                    await response.json();

                if (errorData.detail) {
                    errorMessage = errorData.detail;
                }

            } catch {
                // Ignore invalid error response
            }

            throw new Error(errorMessage);
        }

        /* -----------------------------------------
           Parse response
        ----------------------------------------- */

        const data = await response.json();

        typingElement.remove();

        /* -----------------------------------------
           IMAGE RESPONSE
        ----------------------------------------- */

        if (selectedImageFile) {

            let result = data;

            if (typeof result === "string") {
                result = JSON.parse(result);
            }

            addMessage(
                result.suggested_outfit ||
                "I analyzed the image successfully.",
                "assistant"
            );

            /* Clear image AFTER processing */

            if (imagePreview) {
                imagePreview.style.display = "none";
            }

            if (previewImage) {
                previewImage.src = "";
            }

            selectedImageFile = null;

            if (wardrobeImageInput) {
                wardrobeImageInput.value = "";
            }

        }

        /* -----------------------------------------
           NORMAL CHAT RESPONSE
        ----------------------------------------- */

        else {

            if (!data.response) {

                throw new Error(
                    "The AI returned an empty response."
                );
            }

            addMessage(
                data.response,
                "assistant"
            );

            updateContext(data);
        }

    } catch (error) {

        console.error(
            "Mr.Shop API Error:",
            error
        );

        if (typingElement) {
            typingElement.remove();
        }

        addMessage(
            getFriendlyErrorMessage(error),
            "assistant",
            true
        );

    } finally {

        setLoading(false);

        messageInput.focus();
    }
}

/* =========================================================
   FRIENDLY ERROR MESSAGE
   ========================================================= */

function getFriendlyErrorMessage(error) {

    if (!navigator.onLine) {

        return (
            "You appear to be offline. " +
            "Please check your internet connection and try again."
        );
    }


    if (
        error.message &&
        error.message.includes("Failed to fetch")
    ) {

        return (
            "I couldn't connect to Mr.Shop right now. " +
            "Please make sure the FastAPI server is running."
        );
    }


    return (
        "Something went wrong while processing your request. " +
        "Please try again."
    );
}


/* =========================================================
   ADD MESSAGE
   ========================================================= */

function addMessage(text, sender, isError = false) {

    const messageRow = document.createElement("div");
    messageRow.className = `message-row ${sender}`;

    if (isError) {
        messageRow.classList.add("error-message");
    }

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = sender === "user" ? "U" : "✦";

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    const messageLabel = document.createElement("span");
    messageLabel.className = "message-label";
    messageLabel.textContent =
        sender === "user" ? "YOU" : "MR.SHOP";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (sender === "assistant" && !isError) {
        bubble.innerHTML = formatAIResponse(text);
    } else {
        bubble.textContent = text;
    }

    if (sender === "assistant") {
    messageContent.appendChild(messageLabel);
    }

    messageContent.appendChild(bubble);

    messageRow.appendChild(avatar);
    messageRow.appendChild(messageContent);

    messages.appendChild(messageRow);

    scrollToBottom();
}
function formatAIResponse(text) {

    if (!text) {
        return "";
    }

    let formatted = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Bold text
    formatted = formatted.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Headings like "Outfit 1:"
    formatted = formatted.replace(
        /(^|\n)(Outfit\s+\d+\s*[-:]?[^<\n]*)/gi,
        '$1<div class="ai-heading">$2</div>'
    );

    // Labels like Top:, Shoes:, Layer:, Accessories:
    formatted = formatted.replace(
        /(^|\n)(Top|Layer|Shoes|Accessories|Why it works|Item|Suggested style|Price)\s*:/gi,
        '$1<div class="ai-label">$2</div>'
    );

    // Bullet points
    formatted = formatted.replace(
        /(^|\n)[•*-]\s*(.*)/g,
        '$1<div class="ai-bullet"><span>•</span><span>$2</span></div>'
    );

    // New lines
    formatted = formatted.replace(/\n/g, "<br>");

    return formatted;
}


/* =========================================================
   ASSISTANT MESSAGE RENDERER
   ========================================================= */

function renderAssistantMessage(
    container,
    text
) {

    /*
       We intentionally support only a small,
       controlled subset of Markdown.

       This avoids injecting arbitrary HTML
       returned by an LLM.
    */

    const lines =
        text.split("\n");


    lines.forEach((line, index) => {

        const trimmed =
            line.trim();


        if (!trimmed) {

            if (index !== lines.length - 1) {

                container.appendChild(
                    document.createElement("br")
                );
            }

            return;
        }


        /* -----------------------------------------
           Bullet list
        ----------------------------------------- */

        if (
            trimmed.startsWith("- ") ||
            trimmed.startsWith("* ")
        ) {

            const bullet =
                document.createElement("div");

            bullet.className =
                "assistant-bullet";

            const content =
                trimmed.substring(2);

            bullet.appendChild(
                createFormattedText(content)
            );

            container.appendChild(
                bullet
            );

            return;
        }


        /* -----------------------------------------
           Normal paragraph
        ----------------------------------------- */

        const paragraph =
            document.createElement("div");

        paragraph.className =
            "assistant-paragraph";

        paragraph.appendChild(
            createFormattedText(trimmed)
        );

        container.appendChild(
            paragraph
        );

    });
}


/* =========================================================
   SAFE BASIC FORMATTING
   ========================================================= */

function createFormattedText(text) {

    const fragment =
        document.createDocumentFragment();


    /*
       Split around **bold** sections.
    */

    const parts =
        text.split(/(\*\*[^*]+\*\*)/g);


    parts.forEach(part => {

        if (
            part.startsWith("**") &&
            part.endsWith("**")
        ) {

            const strong =
                document.createElement("strong");

            strong.textContent =
                part.slice(2, -2);

            fragment.appendChild(
                strong
            );

        } else {

            fragment.appendChild(
                document.createTextNode(part)
            );
        }

    });


    return fragment;
}


/* =========================================================
   TYPING INDICATOR
   ========================================================= */

function addTypingIndicator() {

    const messageRow =
        document.createElement("div");

    messageRow.className =
        "message-row assistant typing-row";


    messageRow.innerHTML = `
        <div class="message-avatar">✦</div>

        <div class="message-content">

            <span class="message-label">
                MR.SHOP
            </span>

            <div class="message-bubble typing-bubble">

                <span></span>
                <span></span>
                <span></span>

            </div>

        </div>
    `;


    messages.appendChild(
        messageRow
    );


    scrollToBottom();


    return messageRow;
}


/* =========================================================
   UPDATE CONTEXT PANEL
   ========================================================= */

function updateContext(data) {

    /* -----------------------------------------
       Intent
    ----------------------------------------- */

    if (
        data.intent &&
        intentBadge
    ) {

        intentBadge.textContent =
            formatIntent(data.intent);


        intentBadge.classList.add(
            "intent-updated"
        );


        setTimeout(() => {

            intentBadge.classList.remove(
                "intent-updated"
            );

        }, 500);
    }


    /* -----------------------------------------
       Context
    ----------------------------------------- */

    const context =
        data.context;


    if (!context) {
        return;
    }


    /* -----------------------------------------
       Wardrobe
    ----------------------------------------- */

    if (
        Array.isArray(context.wardrobe)
    ) {

        wardrobeCount.textContent =
            context.wardrobe.length;

        renderWardrobe(
            context.wardrobe
        );
    }


    /* -----------------------------------------
       Budget
    ----------------------------------------- */

    if (
        context.budget !== undefined &&
        context.budget !== null &&
        context.budget !== ""
    ) {

        const numericBudget =
            Number(context.budget);


        if (!Number.isNaN(numericBudget)) {

            budgetValue.textContent =
                `₹${numericBudget.toLocaleString("en-IN")}`;

        } else {

            budgetValue.textContent =
                String(context.budget);
        }

    } else {

        budgetValue.textContent = "—";
    }


    /* -----------------------------------------
       Color preference
    ----------------------------------------- */

    const color =
        context.color ||
        context.color_preference;


    colorPreference.textContent =
        color || "—";
}


/* =========================================================
   RENDER WARDROBE
   ========================================================= */

function renderWardrobe(items) {

    wardrobeList.innerHTML = "";


    if (!items.length) {

        wardrobeList.innerHTML = `
            <div class="empty-context">
                No wardrobe items yet
            </div>
        `;

        return;
    }


    items.forEach(item => {

        const wardrobeItem =
            document.createElement("div");

        wardrobeItem.className =
            "wardrobe-item";


        const icon =
            document.createElement("span");

        icon.className =
            "wardrobe-item-icon";

        icon.textContent = "◇";


        const name =
            document.createElement("span");

        name.className =
            "wardrobe-item-name";

        name.textContent =
            item;


        wardrobeItem.appendChild(
            icon
        );

        wardrobeItem.appendChild(
            name
        );

        wardrobeList.appendChild(
            wardrobeItem
        );
    });
}


/* =========================================================
   FORMAT INTENT
   ========================================================= */

function formatIntent(intent) {

    return String(intent)
        .replaceAll("_", " ")
        .toUpperCase();
}


/* =========================================================
   SUGGESTIONS
   ========================================================= */

function useSuggestion(text) {

    if (isLoading) {
        return;
    }


    messageInput.value =
        text;


    autoResizeTextarea();

    messageInput.focus();

    sendMessage();
}


/* =========================================================
   ENTER TO SEND
   ========================================================= */

function handleKeyDown(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();
    }
}


/* =========================================================
   TEXTAREA AUTO RESIZE
   ========================================================= */

function autoResizeTextarea() {

    if (!messageInput) {
        return;
    }


    messageInput.style.height =
        "auto";


    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            130
        ) + "px";
}


if (messageInput) {

    messageInput.addEventListener(
        "input",
        autoResizeTextarea
    );
}


/* =========================================================
   LOADING STATE
   ========================================================= */

function setLoading(loading) {

    isLoading =
        loading;


    if (sendButton) {

        sendButton.disabled =
            loading;

        sendButton.setAttribute(
            "aria-busy",
            loading
        );

        sendButton.style.opacity =
            loading
                ? "0.45"
                : "1";
    }


    if (messageInput) {

        messageInput.disabled =
            loading;
    }
}


/* =========================================================
   SCROLL
   ========================================================= */

function scrollToBottom() {

    requestAnimationFrame(() => {

        messages.scrollTo({

            top:
                messages.scrollHeight,

            behavior:
                "smooth"
        });

    });
}


/* =========================================================
   RESET CONTEXT UI
   ========================================================= */

function resetContextUI() {

    if (intentBadge) {
        intentBadge.textContent =
            "WAITING";
    }


    if (wardrobeCount) {
        wardrobeCount.textContent =
            "0";
    }


    if (wardrobeList) {

        wardrobeList.innerHTML = `
            <div class="empty-context">
                No wardrobe items yet
            </div>
        `;
    }


    if (colorPreference) {
        colorPreference.textContent =
            "—";
    }


    if (budgetValue) {
        budgetValue.textContent =
            "—";
    }
}

/* =========================================================
   NEW CHAT
========================================================= */

function startNewChat() {

    if (isLoading) {
        return;
    }


    conversationStarted =
        false;


    messages.innerHTML = "";


    messageInput.value = "";


    resetContextUI();


    /*
       Re-create welcome state.
    */

    messages.innerHTML = `
        <div class="welcome-state" id="welcomeState">

            <div class="welcome-icon">
                ✦
            </div>

            <span class="welcome-eyebrow">
                YOUR PERSONAL STYLE ASSISTANT
            </span>

            <h2>
                What are we styling today?
            </h2>

            <p>
                Tell me what you own, what you're looking for,
                or where you're going. I'll keep the relevant
                context as we go.
            </p>

            <div class="suggestions">

                <button
                    class="suggestion-card"
                    type="button"
                    onclick="useSuggestion('I have black jeans. Suggest an outfit.')"
                >

                    <span class="suggestion-icon">
                        ✦
                    </span>

                    <span class="suggestion-content">

                        <strong>
                            Style an outfit
                        </strong>

                        <small>
                            Build a look from my wardrobe
                        </small>

                    </span>

                    <span class="suggestion-arrow">
                        →
                    </span>

                </button>


                <button
                    class="suggestion-card"
                    type="button"
                    onclick="useSuggestion('Recommend white sneakers under 3000.')"
                >

                    <span class="suggestion-icon">
                        ◈
                    </span>

                    <span class="suggestion-content">

                        <strong>
                            Find something to buy
                        </strong>

                        <small>
                            Discover products within my budget
                        </small>

                    </span>

                    <span class="suggestion-arrow">
                        →
                    </span>

                </button>


                <button
                    class="suggestion-card"
                    type="button"
                    onclick="useSuggestion('I want to upload a shirt to my wardrobe.')"
                >

                    <span class="suggestion-icon">
                        □
                    </span>

                    <span class="suggestion-content">

                        <strong>
                            Add to wardrobe
                        </strong>

                        <small>
                            Keep my clothing collection updated
                        </small>

                    </span>

                    <span class="suggestion-arrow">
                        →
                    </span>

                </button>


                <button
                    class="suggestion-card"
                    type="button"
                    onclick="useSuggestion('I want to book a stylist consultation.')"
                >

                    <span class="suggestion-icon">
                        ○
                    </span>

                    <span class="suggestion-content">

                        <strong>
                            Book a stylist
                        </strong>

                        <small>
                            Get help from a style expert
                        </small>

                    </span>

                    <span class="suggestion-arrow">
                        →
                    </span>

                </button>

            </div>

        </div>
    `;


    autoResizeTextarea();

    messageInput.focus();
}


/* =========================================================
   CLEAR CONVERSATION
   ========================================================= */

function clearConversation() {

    if (!conversationStarted) {
        return;
    }


    if (isLoading) {
        return;
    }


    const confirmed =
        window.confirm(
            "Clear this conversation?"
        );


    if (!confirmed) {
        return;
    }


    startNewChat();
}


/* =========================================================
   INITIAL STATE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setLoading(false);

        autoResizeTextarea();

        if (messageInput) {
            messageInput.focus();
        }

    }
);

function addImageMessage(file) {
    console.log("IMAGE FUNCTION CALLED", file);
    const messageRow = document.createElement("div");
    messageRow.className = "message-row user";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "U";

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = "Uploaded image";
    image.style.maxWidth = "300px";
    image.style.borderRadius = "12px";
    image.style.display = "block";

    bubble.appendChild(image);
    messageContent.appendChild(bubble);

    messageRow.appendChild(avatar);
    messageRow.appendChild(messageContent);

    messages.appendChild(messageRow);

    scrollToBottom();
}
let selectedImageFile = null;
const wardrobeImageInput = document.getElementById("wardrobeImageInput");
const imagePreview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");

if (wardrobeImageInput) {
    wardrobeImageInput.addEventListener("change", function () {

        const file = this.files[0];

        if (!file) {
            return;
        }
        selectedImageFile = file

        // Show selected image in preview
        previewImage.src = URL.createObjectURL(file);
        imagePreview.style.display = "block";

        console.log("IMAGE SELECTED:", file);
    });
}