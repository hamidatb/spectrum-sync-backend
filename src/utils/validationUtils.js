/**
 * Utility function to validate the presence of required fields in the request body.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Array} requiredFields - An array of required field names to check.
 * @returns {Boolean} - Returns true if all required fields are present, otherwise sends a 400 response.
 */
const validateFields = (req, res, requiredFields) => {
    const missingFields = [];

    // Check for missing fields
    requiredFields.forEach((field) => {
        if (!req.body[field]) {
            missingFields.push(field);
        }
    });

    // If there are missing fields, return a 400 response
    if (missingFields.length > 0) {
        console.warn('Missing required fields:', missingFields);
        res.status(400).json({
            message: `The following fields are required: ${missingFields.join(', ')}`,
        });
        return false;
    }

    return true;
};

/**
 * Utility function to validate the user ID.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {Boolean} - Returns true if userId is valid, otherwise sends a 401 response.
 */
const validateUserId = (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        console.warn('User ID is missing from the request. Authorization failed.');
        res.status(401).json({ message: 'Unauthorized. Please log in again.' });
        return false;
    }
    return true;
};

/**
 * Utility function to validate the event ID.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {Boolean} - Returns true if eventId is valid, otherwise sends a 400 response.
 */
const validateEventId = (req, res) => {
    const eventId = req.params?.id;
    if (!eventId) {
        console.warn('Event ID is missing from the request.');
        res.status(400).json({ message: 'Event ID is required.' });
        return false;
    }
    return true;
};

module.exports = {
    validateUserId,
    validateEventId,
    validateFields,
};