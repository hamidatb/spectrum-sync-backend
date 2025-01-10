const sql = require('mssql');

class Chat {
    constructor(chatId, chatName, isGroupChat, createdBy, createdAt) {
        this.chatId = chatId;
        this.chatName = chatName;
        this.isGroupChat = isGroupChat;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    static async create(pool, chatName, isGroupChat, createdBy) {
        const result = await pool.request()
            .input('chatName', sql.NVarChar, chatName)
            .input('isGroupChat', sql.Bit, isGroupChat)
            .input('createdBy', sql.Int, createdBy)
            .query(`
                INSERT INTO Chats (chatName, isGroupChat, createdBy)
                VALUES (@chatName, @isGroupChat, @createdBy);
                SELECT SCOPE_IDENTITY() AS chatId;
            `);

        const chatId = result.recordset[0].chatId;
        return new Chat(chatId, chatName, isGroupChat, createdBy, new Date());
    }

    static async addMembers(pool, chatId, userIds) {
        const queries = userIds.map(userId => {
            return pool.request()
                .input('chatId', sql.Int, chatId)
                .input('userId', sql.Int, userId)
                .query(`
                    INSERT INTO ChatMembers (chatId, userId)
                    VALUES (@chatId, @userId)
                `);
        });
        await Promise.all(queries);
    }

    static async isValidFriend(pool, creatorId, userIds) {
        const friendCheckResult = await pool.request()
            .input('creatorId', sql.Int, creatorId)
            .query(`
                SELECT friendUserId FROM Friends
                WHERE userId = @creatorId AND friendUserId IN (${userIds.join(',')})
            `);
        return friendCheckResult.recordset.length === userIds.length;
    }

    static async isMember(pool, chatId, userId) {
        const memberCheckResult = await pool.request()
            .input('chatId', sql.Int, chatId)
            .input('userId', sql.Int, userId)
            .query(`SELECT chatMemberId FROM ChatMembers WHERE chatId = @chatId AND userId = @userId`);
        return memberCheckResult.recordset.length > 0;
    }

    static async removeMember(pool, chatId, userId) {
        await pool.request()
            .input('chatId', sql.Int, chatId)
            .input('userId', sql.Int, userId)
            .query(`
                DELETE FROM ChatMembers WHERE chatId = @chatId AND userId = @userId
            `);
    }
}

module.exports = Chat;