async function testServer() {
    console.log("Testing Chatbot Server Endpoint...");
    try {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "Hello, tell me about a festival." })
        });

        console.log("Status:", response.status);
        const data = await response.json();

        if (response.ok) {
            console.log("Success! Reply:", data.reply);
        } else {
            console.log("Error:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Failed to connect to server:", error.message);
        console.log("Make sure the server is running on port 3000 (node server.js)");
    }
}

testServer();
