const sql = require('mssql');
const connectToDatabase = require('../utils/dbConnection');
const { validateUserId, validateEventId, validateFields } = require('../utils/validationUtils');

// (POST) Create a new event
exports.createEvent = async (req, res) => {
    const { title, description, date, location } = req.body;
    console.log('Received request to create a new event:', { title, description, date, location });

    // Basic validation
    if (!title || !date || !location) {
        console.warn('Missing required fields:', { title, date, location });
        return res.status(400).json({ message: 'Please enter all required fields' });
    }

    if (!validateUserId(req, res)) return; // Validate user ID

    try {
        const pool = await connectToDatabase();

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
    } 
};

// (GET) Retrieve all events for a user 
exports.getEvents = async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        console.warn('User ID is missing from the request. Authorization failed.');
        return res.status(401).json({ message: 'Unauthorized. Please log in again.' });
    }

    console.log('Received request to fetch events for user:', userId);


    try {
        const pool = await connectToDatabase();

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
    } 
};

// (GET) Retrieve event details by id
exports.getEventById = async (req, res) => {
    const eventId = req.params?.id;
    const userId = req.user?.id;

    console.log('Recieved request to get event details:', {eventId, userId});

    // Validate event ID and user ID
    if (!eventId) {
        console.warn('Event ID is missing in the request.');
        return res.status(400).json({ message: 'Event ID is required' });
    }

    if (!userId) {
        console.warn('User ID is missing from the request. Authorization failed.');
        return res.status(401).json({ message: 'Unauthorized. Please log in again.' });
    }

    const pool = await connectToDatabase();

    // Retrieve the event details
    const eventDetails = await pool.request()
        .input('eventId', sql.Int, eventId)
        .input('userId', sql.Int. userId)
        .query(
            'SELECT * FROM EVENTS WHERE id = @eventId AND userId = @userId'
        );
    
    if (eventDetails.recordset.length === 0){
        console.warn('No event found for the provided ID: ', eventId);
        return res.status(404)
    }


};
