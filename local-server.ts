import express from 'express';
import { handler as viewCountHandler } from './netlify/functions/view-count';
import { handler as downloadCountHandler } from './netlify/functions/download-count';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the current directory (for index.html and assets)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname));

// Mock Netlify Function Context
const mockContext = {};

// Helper to adapt Express request to Netlify event
const createEvent = (req) => {
    return {
        httpMethod: req.method,
        queryStringParameters: req.query,
        body: JSON.stringify(req.body),
        headers: req.headers,
    };
};

// Helper to adapt Netlify response to Express response
const handleNetlifyResponse = async (res, handlerPromise) => {
    try {
        const result = await handlerPromise;
        res.status(result.statusCode).set(result.headers || {}).send(result.body);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Routes for Functions
app.all('/.netlify/functions/view-count', (req, res) => {
    handleNetlifyResponse(res, viewCountHandler(createEvent(req), mockContext));
});

app.all('/.netlify/functions/download-count', (req, res) => {
    handleNetlifyResponse(res, downloadCountHandler(createEvent(req), mockContext));
});

import { handler as commentsHandler } from './netlify/functions/comments';
app.all('/.netlify/functions/comments', (req, res) => {
    handleNetlifyResponse(res, commentsHandler(createEvent(req), mockContext));
});

// Start server
app.listen(PORT, () => {
    console.log(`Local server running at http://localhost:${PORT}`);
    console.log(`Testing Database Connection...`);
    if (process.env.DATABASE_URL) {
        console.log("DATABASE_URL is set.");
    } else {
        console.warn("WARNING: DATABASE_URL is NOT set in .env.local");
    }
});
