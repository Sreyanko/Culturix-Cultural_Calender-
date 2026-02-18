require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = "https://openrouter.ai/api/v1/chat/completions";

console.log("Checking API configuration...");
console.log(`API Key present: ${API_KEY ? 'Yes' : 'No'}`);
if (API_KEY) {
    console.log(`API Key starts with: ${API_KEY.substring(0, 4)}...`);
}

async function testChat() {
    if (!API_KEY) {
        console.error("Error: GEMINI_API_KEY is missing in .env");
        return;
    }

    console.log(`Sending request to: ${URL}`);

    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Culturix",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "xiaomi/mimo-v2-flash",
                "max_tokens": 100,
                "messages": [
                    { "role": "user", "content": "Hello, are you working?" }
                ]
            })
        });

        const data = await response.json();

        console.log("Response status:", response.status);
        if (response.ok) {
            console.log("Success! Reply:", data.choices?.[0]?.message?.content);
        } else {
            console.log("Error response:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Fetch error:", error.message);
    }
}

testChat();
