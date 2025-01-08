const jwt = require('jsonwebtoken'); // Authentication token handling
const bcrypt = require('bcryptjs'); // Password hashing
const sql = require('mssql'); // SQL Server connection
const connectToDatabase = require('../utils/dbConnection');
const { validateUserId, validateEventId, validateFields } = require('../utils/validationUtils');
require('dotenv').config(); // Load environment variables from .env

// Validate JWT Secret
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error('JWT_SECRET is not set in environment variables.');
}

// Register a new user
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    if (!validateFields(req, res, ['username', 'email', 'password'])) return;

    try {
        const pool = await connectToDatabase();

        // Check if user already exists
        console.log(`Checking if user already exists with email: ${email}`);
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        if (result.recordset.length > 0) {
            console.log('User already exists.');
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        console.log('Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Password hashed.');

        // Insert new user into the database
        console.log('Inserting new user into the database...');
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('passwordHash', sql.NVarChar, hashedPassword)
            .query(
                'INSERT INTO Users (username, email, passwordHash) VALUES (@username, @email, @passwordHash)'
            );

        console.log('User inserted successfully.');

        // Retrieve the inserted user
        console.log('Retrieving the newly inserted user...');
        const userResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        const user = userResult.recordset[0];

        // Create JWT token
        console.log('Creating JWT token...');
        const token = jwt.sign({ id: user.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            token,
            user: {
                id: user.userId,
                username: user.username,
                email: user.email,
            },
        });
        console.log('Registration successful.');
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } 
};

// Login user
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Basic validation

    if (!validateFields(req, res, ['email', 'password'])) return;

    try {
        const pool = await connectToDatabase();

        // Find user by email
        console.log(`Searching for user with email: ${email}`);
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        if (result.recordset.length === 0) {
            console.log('User not found.');
            return res.status(400).json({ message: 'User does not exist' });
        }

        const user = result.recordset[0];

        // Compare password
        console.log('Comparing password...');
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            console.log('Invalid credentials.');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        console.log('Creating JWT token...');
        const token = jwt.sign({ id: user.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            token,
            user: {
                id: user.userId,
                username: user.username,
                email: user.email,
            },
        });
        console.log('Login successful.');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } 
};
