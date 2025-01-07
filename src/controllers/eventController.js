const sql = require('mssql');
const Event = require('../models/Event');
require('dotenv').config();

// Configure SQL Server connection
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10),
};

// (POST) Create a new event
exports.createEvent = async (req, res) => {
    const { title, description, date, location } = req.body;
    console.log('Received request to create a new event:', { title, description, date, location });

    // Basic validation
    if (!title || !date || !location) {
        console.warn('Missing required fields:', { title, date, location });
        return res.status(400).json({ message: 'Please enter all required fields' });
    }

    try {
        console.log('Connecting to SQL server...');
        await sql.connect(config);
        console.log('SQL server connected.');

        // Insert new event
        const insertResult = await pool.request()
            .input('title', sql.VarChar, title)
            .input('description', sql.VarChar, description || null)
            .input('date', sql.DateTime, date)
            .input('location', sql.VarChar, location)
            .input('userId', sql.Int, req.user.id)
            .query('INSERT INTO Events (title, description, date, location, userId) VALUES (@title, @description, @date, @location, @userId)');

        console.log('Event inserted successfully:', insertResult);
        // Return the inserted event details
        res.status(201).json({
            message: 'Event created successfully',
            event: {
                title,
                description,
                date,
                location,
                userId: req.user.id
            },
            insertResult: insertResult.recordset
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message
        });
    } finally {
        console.log('Closing SQL connection...');
        await sql.close();
        console.log('SQL connection closed.');
    }
};

// (POST) Retrieve all events for a user 
exports.getEvents = async (req, res) => {
    console.log('Received request to fetch events for user:', req.user.id);

    try {
        console.log('Connecting to SQL server...');
        const pool = await sql.connect(config);
        console.log('SQL server connected.');

        // Retrieve events using parameterized query
        console.log('Fetching events from the database...');
        const result = await pool.request()
            .input('userId', sql.Int, req.user.id)
            .query('SELECT * FROM Events WHERE userId = @userId ORDER BY date ASC');
        
        console.log('Events fetched successfully:', result.recordset);
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message
        });
    } finally {
        console.log('Closing SQL connection...');
        await sql.close();
        console.log('SQL connection closed.');
    }
};

// (GET) Retrieve event details by id
exports.getEventById = async (req, res) => {
    const eventId = req.params?.id;
    const userId = req.user?.id;

    console.log('Recieved request to get event details:', {eventId, userId});

    //Validate event ID
    if (!eventId) {
        console.warn('Event ID is missing in the request.');
        return res.status(400).json({ message: 'Event ID is required' });
    }

    // Validate user ID
    if (!userId) {
        console.warn('User ID is missing from the request. Authorization failed.');
        return res.status(401).json({ message: 'Unauthorized. Please log in again.' });
    }


};