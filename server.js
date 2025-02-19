const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Initialize express app
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Correct MongoDB connection
mongoose.connect('mongodb://localhost:27017/mydatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB Connected');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

// User schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    registrationNumber: String,
    collegeName: String,
    phoneNumber: String,
    password: String,
});

const User = mongoose.model('User', userSchema);

// JWT secret key
const JWT_SECRET = 'your_secret_key';

// User registration endpoint
app.post('/signup', async (req, res) => {
    try {
        const { name, email, registrationNumber, collegeName, phoneNumber, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user object and save it
        const newUser = new User({
            name,
            email,
            registrationNumber,
            collegeName,
            phoneNumber,
            password: hashedPassword,
        });
        await newUser.save();

        res.status(201).send('User registered successfully');
    } catch (error) {
        console.error('Error saving user:', error.message);
        res.status(500).send('Error saving user');
    }
});

// User login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('User not found');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send('Invalid credentials');

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).send('Error logging in');
    }
});

// Serve the homepage (HTML)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
