const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { initDb } = require('./database');

// Explicitly load .env from the same directory as server.js
const envPath = path.resolve(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error("Error loading .env file:", result.error);
} else {
    console.log("Loaded .env from:", envPath);
    console.log("Parsed variables:", Object.keys(result.parsed || {}));
}

const app = express();
const port = process.env.PORT || 3000;

// Initialize Database
let db;
initDb().then(database => {
    db = database;
}).catch(err => {
    console.error("Failed to initialize database:", err);
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key', // Use a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Authentication Middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Auth Routes

// Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Username already exists' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Get Current User
app.get('/api/user', (req, res) => {
    if (req.session.userId) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Logbook Routes

// Get Logs
app.get('/api/logs', requireAuth, async (req, res) => {
    try {
        const logs = await db.all('SELECT * FROM logs WHERE user_id = ? ORDER BY timestamp DESC', [req.session.userId]);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create Log
app.post('/api/logs', requireAuth, async (req, res) => {
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        await db.run('INSERT INTO logs (user_id, content) VALUES (?, ?)', [req.session.userId, content]);
        res.status(201).json({ message: 'Log created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// OpenRouter API setup
const OPENROUTER_API_KEY = process.env.GEMINI_API_KEY; // Using existing env var name
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const systemPrompt = `You are a helpful and knowledgeable cultural assistant for the website "Culturix". 
        Your goal is to answer questions about cultures, festivals, traditions, and moods.
        
        Examples of user queries:
        - "Tell me about Diwali"
        - "What festivals are in the 'Spiritual' mood?"
        - "What is the origin of Thanksgiving?"
        
        Please provide concise, accurate, and engaging responses.`;

        const response = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Culturix",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "xiaomi/mimo-v2-flash",
                "max_tokens": 1000,
                "messages": [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": message }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('OpenRouter API Error:', data.error);
            // Return the specific error message from OpenRouter
            return res.status(response.status).json({
                error: data.error.message || 'Failed to generate response',
                details: data.error
            });
        }

        const reply = data.choices[0].message.content;
        res.json({ reply: reply });

    } catch (error) {
        console.error('Error with AI API:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`OpenRouter API Key loaded: ${OPENROUTER_API_KEY ? 'Yes' : 'No'}`);
});
