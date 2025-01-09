// utils/logger.js
class Logger {
    log(message) {
        console.log(`[${new Date().toISOString()}] INFO: ${message}`);
    }

    error(message) {
        console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
    }

    warn(message) {
        console.warn(`[${new Date().toISOString()}] WARN: ${message}`);
    }
}

const logger = new Logger();

// Test log to verify logger functionality
logger.log('Logger initialized successfully.');
try {
    logger.log('This is a test log.');
} catch (err) {
    console.error('Logger failed:', err);
}

module.exports = logger;