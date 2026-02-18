require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

console.log("Checking Google Gemini API configuration...");
console.log(`API Key present: ${API_KEY ? 'Yes' : 'No'}`);

async function testGemini() {
    if (!API_KEY) {
        console.error("Error: GEMINI_API_KEY is missing in .env");
        return;
    }

    console.log(`Sending request to Google Generative AI...`);

    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Hello, are you working?" }]
                }]
            })
        });

        const data = await response.json();

        console.log("Response status:", response.status);
        if (response.ok) {
            console.log("Success! Reply:", data.candidates?.[0]?.content?.parts?.[0]?.text);
        } else {
            console.log("Error response:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Fetch error:", error.message);
    }
}

testGemini();
