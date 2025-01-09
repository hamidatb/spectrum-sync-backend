// src/controllers/friendController.js

const sql = require('mssql'); // SQL Server connection
const connectToDatabase = require('../utils/dbConnection');
const handleError = require('../utils/errorHandler');
const { validateFields, validateUserId } = require('../utils/validationUtils');
const logger = require('../utils/logger');

/**
 * (POST) Add a friend
 */
exports.addFriend = async (req, res) => {
    const { friendUserId } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!validateFields(req, res, ['friendUserId'])) return;
    if (!validateUserId(req, res)) return;

    try {
        const pool = await connectToDatabase();

        // Check if the friend relationship already exists
        logger.log(`Checking if friendship already exists between user ${userId} and ${friendUserId}`);
        const friendCheck = await pool.request()
            .input('userId', sql.Int, userId)
            .input('friendUserId', sql.Int, friendUserId)
            .query('SELECT * FROM Friends WHERE userId = @userId AND friendUserId = @friendUserId');

        if (friendCheck.recordset.length > 0) {
            logger.warn(`Friendship already exists between user ${userId} and ${friendUserId}`);
            return res.status(400).json({ message: 'Friendship already exists' });
        }

        // Insert the new friendship
        logger.log(`Adding friendship between user ${userId} and ${friendUserId}`);
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('friendUserId', sql.Int, friendUserId)
            .query(`
                INSERT INTO Friends (userId, friendUserId)
                VALUES (@userId, @friendUserId)
            `);

        logger.log(`Friendship added successfully between user ${userId} and ${friendUserId}`);
        res.status(201).json({ message: 'Friend added successfully' });
    } catch (error) {
        handleError(error, res, 'Error adding friend');
    }
};

/**
 * (POST) Remove a friend
 */
exports.removeFriend = async (req, res) => {
    const { friendUserId } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!validateFields(req, res, ['friendUserId'])) return;
    if (!validateUserId(req, res)) return;

    try {
        const pool = await connectToDatabase();

        // Check if the friend relationship exists
        logger.log(`Checking if friendship exists between user ${userId} and ${friendUserId}`);
        const friendCheck = await pool.request()
            .input('userId', sql.Int, userId)
            .input('friendUserId', sql.Int, friendUserId)
            .query('SELECT * FROM Friends WHERE userId = @userId AND friendUserId = @friendUserId');

        if (friendCheck.recordset.length === 0) {
            logger.warn(`No friendship found between user ${userId} and ${friendUserId}`);
            return res.status(404).json({ message: 'Friend not found' });
        }

        // Delete the friendship
        logger.log(`Removing friendship between user ${userId} and ${friendUserId}`);
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('friendUserId', sql.Int, friendUserId)
            .query(`
                DELETE FROM Friends 
                WHERE userId = @userId AND friendUserId = @friendUserId
            `);

        logger.log(`Friendship removed successfully between user ${userId} and ${friendUserId}`);
        res.status(200).json({ message: 'Friend removed successfully' });
    } catch (error) {
        handleError(error, res, 'Error removing friend');
    }
};
