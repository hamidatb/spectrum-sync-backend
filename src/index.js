// src/index.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes'); // Import event routes
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes); // Use event routes

// Root Route
app.get('/', (req, res) => {
    res.send('Welcome to Spectrum Sync Backend!');
});

// Start Server using the port provided by Azure 
const PORT = process.env.PORT; // Remove any default fall back port
if (!PORT) {
    console.error("PORT environment variable is not set.");
    process.exit(1); // Exit if PORT is not defined
}
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
