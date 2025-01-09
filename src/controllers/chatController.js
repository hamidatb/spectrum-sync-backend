const sql = require('mssql'); // SQL Server connection
const connectToDatabase = require('../utils/dbConnection');
const { validateFields, validateUserId, validateChatId } = require('../utils/validationUtils');
const logger = require('../utils/logger');
const handleError = require('../utils/errorHandler');

/**
 * (POST) Create a new chat
 * Supports both individual and group chats
 */
exports.createChat = async (req, res, next) => {
    const { chatName, userIds } = req.body;
    const creatorId = req.user?.userId;

    // Validate user ID
    if (!validateUserId(req, res)) return;

    // Validate required body fields
    if (!validateFields(req, res, ['userIds'])) return;

    try {
        const pool = await connectToDatabase();

        // Check if user IDs are valid friends
        logger.log(`Checking if user IDs ${userIds} are valid friends of user ${creatorId}`);
        const friendCheckResult = await pool.request()
            .input('creatorId', sql.Int, creatorId)
            .query(`
                SELECT friendUserId FROM Friends
                WHERE userId = @creatorId AND friendUserId IN (${userIds.join(',')})
            `);

        if (friendCheckResult.recordset.length !== userIds.length) {
            logger.warn('Some user IDs are not valid friends.');
            return res.status(400).json({ message: 'Some user IDs are not valid friends.' });
        }

        // Insert the chat into the Chats table
        logger.log('Inserting new chat into the Chats table');
        const chatInsertResult = await pool.request()
            .input('chatName', sql.NVarChar, chatName || null)
            .input('isGroupChat', sql.Bit, userIds.length > 1)
            .input('createdBy', sql.Int, creatorId)
            .query(`
                INSERT INTO Chats (chatName, isGroupChat, createdBy)
                VALUES (@chatName, @isGroupChat, @createdBy);
                SELECT SCOPE_IDENTITY() AS chatId;
            `);

        const chatId = chatInsertResult.recordset[0].chatId;
        logger.log(`Chat created successfully with chatId: ${chatId}`);

        // Add members to the ChatMembers table
        logger.log('Adding members to the ChatMembers table');
        for (const userId of [creatorId, ...userIds]) {
            await pool.request()
                .input('chatId', sql.Int, chatId)
                .input('userId', sql.Int, userId)
                .query(`
                    INSERT INTO ChatMembers (chatId, userId)
                    VALUES (@chatId, @userId)
                `);
        }

        res.status(201).json({ message: 'Chat created successfully', chatId });
        logger.log('Chat creation process completed successfully.');
    } catch (error) {
        handleError(error, res, 'Error creating chat');
    }
};

/**
 * (POST) Join a chat
 */
exports.joinChat = async (req, res, next) => {
    const chatId = req.params.chatId;
    const userId = req.user?.userId;

    // Validate user ID
    if (!validateUserId(req, res)) return;
    // Validate chat ID
    if (!validateChatId(req, res)) return;

    try {
        const pool = await connectToDatabase();

        // Check if the user is already a member
        logger.log(`Checking if user ${userId} is already a member of chat ${chatId}`);
        const memberCheckResult = await pool.request()
            .input('chatId', sql.Int, chatId)
            .input('userId', sql.Int, userId)
            .query(`SELECT chatMemberId FROM ChatMembers WHERE chatId = @chatId AND userId = @userId`);

        if (memberCheckResult.recordset.length > 0) {
            logger.warn('User is already a member of this chat.');
            return res.status(400).json({ message: 'User is already a member of this chat.' });
        }

        // Add user to the ChatMembers table
        logger.log('Adding user to the ChatMembers table');
        await pool.request()
            .input('chatId', sql.Int, chatId)
            .input('userId', sql.Int, userId)
            .query(`
                INSERT INTO ChatMembers (chatId, userId)
                VALUES (@chatId, @userId)
            `);

        res.status(200).json({ message: 'Joined chat successfully' });
        logger.log('User joined chat successfully.');
    } catch (error) {
        handleError(error, res, 'Error joining chat');
    }
};

/**
 * (POST) Leave a chat
 */
exports.leaveChat = async (req, res, next) => {
    const chatId = req.params.chatId;
    const userId = req.user?.userId;

    // Validate user ID
    if (!validateUserId(req, res)) return;
    // Validate chat ID
    if (!validateChatId(req, res)) return;

    try {
        const pool = await connectToDatabase();

        // Remove user from the ChatMembers table
        logger.log(`Removing user ${userId} from chat ${chatId}`);
        await pool.request()
            .input('chatId', sql.Int, chatId)
            .input('userId', sql.Int, userId)
            .query(`
                DELETE FROM ChatMembers WHERE chatId = @chatId AND userId = @userId
            `);

        res.status(200).json({ message: 'Left chat successfully' });
        logger.log('User left chat successfully.');
    } catch (error) {
        handleError(error, res, 'Error leaving chat');
    }
};

/**
 * (POST) Send a message to a chat
 */
exports.sendMessage = async (req, res, next) => {
    const chatId = req.params.chatId;
    const userId = req.user?.userId;
    const { content } = req.body;

    // Validate user ID
    if (!validateUserId(req, res)) return;

    // Validate required fields
    if (!validateFields(req, res, ['content'])) return;

    // Validate chat ID
    if (!validateChatId(req, res)) return;

    try {
        const pool = await connectToDatabase();

        // Insert the message into the Messages table
        logger.log(`Inserting message into Messages table for chat ${chatId}`);
        const messageInsertResult = await pool.request()
            .input('chatId', sql.Int, chatId)
            .input('userId', sql.Int, userId)
            .input('content', sql.NVarChar, content)
            .query(`
                INSERT INTO Messages (chatId, userId, content)
                VALUES (@chatId, @userId, @content);
                SELECT SCOPE_IDENTITY() AS messageId;
            `);

        const messageId = messageInsertResult.recordset[0].messageId;
        logger.log(`Message sent successfully with messageId: ${messageId}`);

        res.status(201).json({ message: 'Message sent successfully', messageId });
    } catch (error) {
        handleError(error, res, 'Error sending message');
    }
};