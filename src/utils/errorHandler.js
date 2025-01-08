// utils/errorHandler.js

/**
 * Utility function to handle errors in async routes.
 * Logs the error details and sends a JSON response to the client.
 * @param {Error} error - The error object.
 * @param {Response} res - The response object from Express.
 * @param {String} customMessage - Optional custom message to include in the response.
 */
function handleError(error, res, customMessage = 'Server error') {
    // Log error details for debugging
    console.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
    });

    // Send standardized error response to the client
    res.status(500).json({
        message: customMessage,
        error: error.message,
    });
}

module.exports = handleError;
