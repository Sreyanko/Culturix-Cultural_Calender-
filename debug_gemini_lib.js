require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;

console.log("Checking Google Gemini API with library...");
console.log(`API Key present: ${API_KEY ? 'Yes' : 'No'}`);

async function testGeminiLib() {
    if (!API_KEY) {
        console.error("Error: GEMINI_API_KEY is missing in .env");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = "Hello, tell me a verified fact about checking connectivity.";

        console.log(`Sending prompt: "${prompt}"`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("Success! Reply:", text);

    } catch (error) {
        console.error("Library Error:", error);
    }
}

testGeminiLib();
