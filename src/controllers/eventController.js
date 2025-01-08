const sql = require('mssql');
const connectToDatabase = require('../utils/dbConnection');
const { validateUserId, validateEventId, validateFields } = require('../utils/validationUtils');
const handleError = require('../utils/errorHandler');
const { ATTENDEE_STATUS } = require('../utils/constants');

/**
 * (POST) Create a new event
 */
exports.createEvent = async (req, res) => {
    const { title, description, date, location } = req.body;
    const userId = req.user.userId;

    console.log('Received request to create a new event:', { title, description, date, location });

    if (!validateUserId(req, res)) return; 

    try {
        const pool = await connectToDatabase();

        // Insert new event
        const insertResult = await pool.request()
            .input('title', sql.NVarChar, title)
            .input('description', sql.NVarChar, description || null)
            .input('date', sql.DateTime, date)
            .input('location', sql.NVarChar, location)
            .input('userId', sql.Int, userId)
            .query(`
                INSERT INTO Events (title, description, date, location, userId) 
                VALUES (@title, @description, @date, @location, @userId);
        
                SELECT * FROM Events WHERE eventId = SCOPE_IDENTITY();
            `);

        const newEvent = insertResult.recordset[0];
        console.log('Event inserted successfully:', insertResult);

        // Return the inserted event details
        res.status(201).json({
            message: 'Event created successfully',
            event: newEvent
        });
    } catch (error) {
        handleError(error, res, 'Error creating event');
    } 
};

/**
 * (GET) Retrieve all events for a user 
 */
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
        handleError(error, res, 'Error fetching events');
    } 
};

/**
 * (GET) Retrieve event details by id
 */
exports.getEventById = async (req, res) => {
    if (!validateUserId(req, res)) return;
    if (!validateEventId(req, res)) return;
    
    const userId = req.user.userId;
    const eventId = req.params.id;
    console.log('Recieved request to get event details:', {eventId, userId});

    try {
        const pool = await connectToDatabase();

        const eventDetails = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query(
                'SELECT * FROM Events WHERE eventId = @eventId AND userId = @userId'
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
        handleError(error, res, 'Error retrieving event details');
    }
};

/**
 * (PUT) Edit an event by ID
 */
exports.updateEvent = async (req, res) => {
    const { title, description, date, location } = req.body;
    const userId = req.user.userId;
    const eventId = req.params.id;

    console.log('Received request to edit event:', { eventId, userId, title, description, date, location });

    // Validate required fields
    if (!validateFields(req, res, ['title', 'date', 'location'])) return;
    if (!validateUserId(req, res)) return;
    if (!validateEventId(req, res)) return;

    try {
        const pool = await connectToDatabase();

        // Check if the event exists and belongs to the user
        const eventCheck = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM Events WHERE eventId = @eventId AND userId = @userId');
        
        if (eventCheck.recordset.length === 0){
            console.warn('No event found for the provided ID:', eventId);
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Update the event
        const updateResult = await pool.request()
            .input('title', sql.NVarChar, title)
            .input('description', sql.NVarChar, description || null)
            .input('date', sql.DateTime, date)
            .input('location', sql.NVarChar, location)
            .input('eventId', sql.Int, eventId)
            .query(`
                UPDATE Events
                SET title = @title, description = @description, date = @date, location = @location
                WHERE eventId = @eventId;
        
                SELECT * FROM Events WHERE eventId = SCOPE_IDENTITY() OR eventId = @eventId;
            `);

        const updatedEvent = updateResult.recordset[0];
        console.log('Event updated successfully:', updatedEvent);

        res.status(200).json({
            message: 'Event updated successfully',
            event: updatedEvent
        });
    } catch (error) {
        handleError(error, res, 'Error editing event');
    }
};

/**
 * (DELETE) Delete an event by ID
 */
exports.deleteEvent = async (req, res) => {
    const userId = req.user.userId;
    const eventId = req.params.id;

    console.log('Recieved request to delete event:', {eventId, userId});

    if (!validateUserId(req, res)) return;
    if (!validateEventId(req, res)) return;

    try {
        const pool = await connectToDatabase();

        // Check if the event exists and belongs to the user
        const eventCheck = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM Events WHERE eventId = @eventId AND userId = @userId');

        if (eventCheck.recordset.length === 0){
            console.warn('No event found for the provided ID:', eventId);
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Delete the event
        await pool.request()
            .input('eventId', sql.Int, eventId)
            .query('DELETE FROM Events WHERE eventId = @eventId');

        console.log('Event deleted successfully:', eventId);
        res.status(200).json({ message: 'Event deleted successfully.' });
    } catch (error) {
        handleError(error, res, 'Error deleting event');
    }
};

/**
 * (POST) Share an event with other users
 */
/**
 * (POST) Share an event with other users
 */
exports.shareEvent = async (req, res) => {
    const { email } = req.body;
    const userId = req.user.userId;
    const eventId = req.params.id;

    console.log('Received request to share event:', { eventId, userId, email });

    // Validate required fields
    if (!validateFields(req, res, ['email'])) return;
    if (!validateUserId(req, res)) return;
    if (!validateEventId(req, res)) return;

    try {
        const pool = await connectToDatabase();

        // Check if the event exists and belongs to the user
        const eventCheck = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM Events WHERE eventId = @eventId AND userId = @userId');

        if (eventCheck.recordset.length === 0){
            console.warn('No event found for the provided ID:', eventId);
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Find the user to share with by email
        const userResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT userId FROM Users WHERE email = @email');

        if (userResult.recordset.length === 0){
            console.warn('No user found with the provided email:', email);
            return res.status(404).json({ message: 'User to share with not found.' });
        }

        const sharedUserId = userResult.recordset[0].userId;

        // Check if the event is already shared with the user
        const shareCheck = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('sharedUserId', sql.Int, sharedUserId)
            .query('SELECT * FROM EventAttendees WHERE eventId = @eventId AND userId = @sharedUserId');

        if (shareCheck.recordset.length > 0){
            console.warn('Event already shared with user:', email);
            return res.status(400).json({ message: 'Event already shared with this user.' });
        }

        // Share the event by adding to EventAttendees with status 'Pending'
        await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('sharedUserId', sql.Int, sharedUserId)
            .query('INSERT INTO EventAttendees (eventId, userId, status) VALUES (@eventId, @sharedUserId, \'Pending\')');

        console.log(`Event ${eventId} shared with user ID ${sharedUserId} (${email}) successfully.`);
        res.status(200).json({ message: 'Event shared successfully.' });
    } catch (error) {
        handleError(error, res, 'Error sharing event');
    }
};

/**
 * (POST) RSVP to an event
 */
exports.attendEvent = async (req, res) => {
    const userId = req.user.userId;
    const eventId = req.params.id;
    const { status } = req.body; // Expecting 'Attending' or 'Not Attending'

    console.log('Received request to RSVP to event:', { eventId, userId, status });

    // Validate user and event IDs
    if (!validateUserId(req, res)) return;
    if (!validateEventId(req, res)) return;

    // Validate status
    if (!status || !Object.values(ATTENDEE_STATUS).includes(status)) {
        console.warn('Invalid RSVP status provided:', status);
        return res.status(400).json({ message: 'Invalid RSVP status. Allowed values are "Attending" and "Not Attending".' });
    }

    try {
        const pool = await connectToDatabase();

        // Check if the event exists
        const eventCheck = await pool.request()
            .input('eventId', sql.Int, eventId)
            .query('SELECT * FROM Events WHERE eventId = @eventId');

        if (eventCheck.recordset.length === 0){
            console.warn('No event found for the provided ID:', eventId);
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Check if the user is already an attendee
        const attendeeCheck = await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM EventAttendees WHERE eventId = @eventId AND userId = @userId');

        if (attendeeCheck.recordset.length > 0){
            const currentStatus = attendeeCheck.recordset[0].status;
            if (currentStatus === ATTENDEE_STATUS.ATTENDING || currentStatus === ATTENDEE_STATUS.NOT_ATTENDING){
                console.warn('User has already RSVPed to the event:', eventId);
                return res.status(400).json({ message: `You have already RSVPed as "${currentStatus}".` });
            } else if (currentStatus === ATTENDEE_STATUS.PENDING){
                // Update status to the new value
                await pool.request()
                    .input('eventId', sql.Int, eventId)
                    .input('userId', sql.Int, userId)
                    .input('status', sql.NVarChar, status)
                    .query('UPDATE EventAttendees SET status = @status WHERE eventId = @eventId AND userId = @userId');

                console.log(`User ${userId} updated RSVP to "${status}" for event ${eventId} successfully.`);
                return res.status(200).json({ message: `RSVP updated to "${status}".` });
            }
        }

        // If not already an attendee, add with the specified status
        await pool.request()
            .input('eventId', sql.Int, eventId)
            .input('userId', sql.Int, userId)
            .input('status', sql.NVarChar, status)
            .query('INSERT INTO EventAttendees (eventId, userId, status) VALUES (@eventId, @userId, @status)');

        console.log(`User ${userId} RSVPed as "${status}" to event ${eventId} successfully.`);
        res.status(200).json({ message: `RSVP as "${status}" successful.` });
    } catch (error) {
        handleError(error, res, 'Error RSVPing to event');
    }
};

/**
 * (GET) Get all event invitations for the authenticated user
 */
exports.getInvites = async (req, res) => {
    const userId = req.user.userId;

    console.log('Received request to get all invitation details for user:', userId);

    // Validate user ID
    if (!validateUserId(req, res)) return;

    try {
        const pool = await connectToDatabase();

        // Retrieve invitations (shared events with status 'Pending')
        const invitesResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    E.eventId as eventId, 
                    E.title, 
                    E.description, 
                    E.date, 
                    E.location, 
                    U.userId as ownerId, 
                    U.email as ownerEmail
                FROM EventAttendees EA
                JOIN Events E ON EA.eventId = E.eventId
                JOIN Users U ON E.userId = U.userId
                WHERE EA.userId = @userId AND EA.status = 'Pending'
                ORDER BY E.date ASC
            `);

        console.log(`Fetched ${invitesResult.recordset.length} invitation(s) successfully.`);
        res.status(200).json({
            message: 'Invitations retrieved successfully',
            invitations: invitesResult.recordset
        });
    } catch (error) {
        handleError(error, res, 'Error fetching invitations');
    }
};