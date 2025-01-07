// src/controllers/authController.js

const jwt = require('jsonwebtoken'); // authenticate users
const bcrypt = require('bcryptjs'); // hash passwords
const sql = require('mssql'); // connect to SQL databases 
const User = require('../models/User'); // load env variable form .env to process.env
require('dotenv').config();

// Validate JWT Secret
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error('JWT_SECRET is not set in environment variables.');
}

// Configure SQL Server connection
// These are in the .env
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10),
};

// Register a new user
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields (username, email, and password)' });
    }

    try {
        // Connect to the database
        console.log('Connecting to SQL server...');
        await sql.connect(config);
        console.log('SQL server connected.');

        // Check if user already exists
        console.log('Checking if user already exisst with email {email}');
        const result = await sql.query`SELECT * FROM Users WHERE email = ${email}`; // I love SQL
        if (result.recordset.length > 0) {
            console.log('User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        console.log('Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Password hashed.');

        // Insert new user into the db
        console.log('Inserting new user into the database...');
        // Parameterized queries to avoid injection attacks
        await sql.query(`
            INSERT INTO Users (username, email, password)
            VALUES (@username, @email, @password)
        `, {
            username: username,
            email: email,
            password: hashedPassword
        });
        console.log('User inserted.');
 
        // Retrieve the inserted user
        const userResult = await sql.query`SELECT * FROM Users WHERE email = ${email}`;
        const user = userResult.recordset[0];

        // Create JsonWeb token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });
        console.log('Registration successful.');
    } catch (error) {
        console.error('Error during registration:', error);
        // This is the returning statment that is given back to Postman or Insomnia
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        // Close the SQL connection
        console.log('Closing SQL connection...');
        await sql.close();
    }
};

// Login user
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // Connect to the database
        await sql.connect(config);

        // Find user by email
        const result = await sql.query(`
            SELECT * FROM Users WHERE email = @Email
        `, {
            Email: email
        });        if (result.recordset.length === 0) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const user = result.recordset[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Create JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        // Close the SQL connection
        await sql.close();
    }
};
