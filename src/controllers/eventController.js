const sql = require('mssql');
const connectToDatabase = require('../utils/dbConnection');
const { validateUserId, validateEventId, validateFields } = require('../utils/validationUtils');

// (POST) Create a new event
exports.createEvent = async (req, res) => {
    console.log('Received request to create a new event:', { title, description, date, location });

    if (!validateFields(req, res, ['title', 'date', 'location'])) return;
    if (!validateUserId(req, res)) return; 

    const { title, description, date, location } = req.body;
    const userId = req.user.userId;

    try {
        const pool = await connectToDatabase();

        // Insert new event
        const insertResult = await pool.request()
            .input('title', sql.NVarChar, title)
            .input('description', sql.NVarChar, description || null)
            .input('date', sql.DateTime, date)
            .input('location', sql.NVarChar, location)
            .input('userId', sql.Int, userId)
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
                userId: req.user.userId
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
    if (!validateUserId(req, res)) return;

    const userId = req.user.userId;
    console.log('Received request to fetch events for user:', userId);

    try {
        const pool = await connectToDatabase();

        // Retrieve events using parameterized query
        console.log('Fetching events from the database...');
        const result = await pool.request()
            .input('userId', sql.Int, userId)
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
    if (!validateUserId(req, res)) return;
    if (!validateEventId(req, res)) return;
    
    const userId = req.user.userId;
    const eventId = red.params.id;
    console.log('Recieved request to get event details:', {eventId, userId});

    try {
        const eventDetails = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId'. sql.Int, userId)
            .query(
                'SELECT * FROM Events WHERE id = @eventId AND userId = @userId'
            );
        
        if (eventDetails.recordset.length === 0) {
            console.warn('No event found for the provided ID:', eventId);
            return res.status(404).json({ message: 'Event not found.' });
        }

        console.log('Event details retrieved successfully:', eventDetails.recordset[0]);
        res.status(200).json({
            message: 'Event details retrieved successfully',
            event: eventDetails.recordset[0],
        });
    } catch (error){
        console.error('Error retrieving event details: ', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message,
        });
    }
};

// TODO - (PUT) Edit event by id
exports.updateEvent = async (req, res) => {
    if (!validateUserId(req, res)) return;
    if (!validateEventId(req, res)) return;
    
    const userId = req.user.userId;
    const eventId = red.params.id;
    console.log('Recieved request to edit event}:', {eventId, userId});
};

// TODO - (DELETE) Delete event by id
exports.deleteEvent = async (req, res) => {
    if (!validateUserId(req, res)) return;
    if (!validateEventId(req, res)) return;
    
    const userId = req.user.userId;
    const eventId = red.params.id;
    console.log('Recieved request to delete event:', {eventId, userId});
};

// TODO - (POST) Share an event with others by id
exports.shareEvent = async (req, res) => {
    if (!validateUserId(req, res)) return;
    if (!validateEventId(req, res)) return;
    
    const userId = req.user.userId;
    const eventId = red.params.id;
    console.log('Recieved request to share event details:', {eventId, userId});
};

// TODO - (POST) RSVP to an event by id
exports.attendEvent = async (req, res) => {
    if (!validateUserId(req, res)) return;
    if (!validateEventId(req, res)) return;
    
    const userId = req.user.userId;
    const eventId = red.params.id;
    console.log('Recieved request to RSVP to event:', {eventId, userId});
};

// TODO - (GET) Get all event invitations of a currently authenticated user 
exports.getInvites = async (req, res) => {
    if (!validateUserId(req, res)) return;
    
    const userId = req.user.userId;
    console.log('Recieved request to get all inviation details of user: ', userId);
}; 