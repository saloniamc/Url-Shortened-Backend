// This will be the entry point of the app.

// Code to set up a basic Express server:
const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const argon2 = require('argon2');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI;
const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(cors());

// MongoDB connection (replace with your MongoDB URI)
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Basic server setup
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';


let users = [];



//To secure certain routes in your application, you can create middleware that checks for a valid JWT.
const authenticateToken = (req, res, next) => {
    // Get the Authorization header and split it by space
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Splits 'Bearer <token>'

    if (!token) return res.sendStatus(401); // Unauthorized

    // Verify the JWT token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
};




// Example of a protected route
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: "This is a protected route!", user: req.user });
});



// Route for the root URL
app.get('/', (req, res) => {
    res.send('Welcome to the URL Shortener!'); // Response for the root URL
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const Url = require('./models/Url');

// POST endpoint to shorten URLs
app.post('/shorten', async (req, res) => {
    const { originalUrl } = req.body;
    const shortUrl = shortid.generate();

    const url = new Url({
        originalUrl,
        shortUrl
    });

    await url.save();
    res.json({ originalUrl, shortUrl });
});

app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase(); // Normalize email

    try {

        // Check if a user with the provided email already exists
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
      
        const hashedPassword = await argon2.hash(password); // Hash the password

        const newUser = new User({
            email: normalizedEmail,
            password:hashedPassword // Save hashed password
        });

        await newUser.save();
        return res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase(); // Normalize email

    try {
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isMatch = await argon2.verify(user.password, password); // Compare plain text with hashed password
        
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        

        return res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


// GET endpoint to redirect to original URL using short URL
app.get('/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    const url = await Url.findOne({ shortUrl });

    if (url) {
        return res.redirect(url.originalUrl);
    } else {
        return res.status(404).json('URL not found');
    }
});

// GET endpoint to retrieve all URLs
app.get('/urls', async (req, res) => {
    try {
        const urls = await Url.find(); // Fetch all URLs from the database
        res.json(urls); // Send the list of URLs as a JSON response
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error'); // Handle any potential errors
    }
});
