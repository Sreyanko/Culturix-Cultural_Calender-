require('dotenv').config();

async function test() {
    console.log("Testing API Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");

    const OPENROUTER_API_KEY = process.env.GEMINI_API_KEY;
    const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

    try {
        const response = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.5-flash",
                "max_tokens": 1000,
                "messages": [
                    { "role": "user", "content": "Hello" }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('OpenRouter API Error:', JSON.stringify(data.error));
        } else {
            console.log("Success:", data.choices[0].message.content);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

test();
