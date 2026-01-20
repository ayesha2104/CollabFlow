const logger = {
    info: (message, data = {}) => {
        console.log(`[INFO] ${message}`, JSON.stringify(data));
    },

    error: (message, error = {}) => {
        console.error(`[ERROR] ${message}`, error);
    },

    warn: (message, data = {}) => {
        console.warn(`[WARN] ${message}`, JSON.stringify(data));
    },

    debug: (message, data = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${message}`, JSON.stringify(data));
        }
    }
};

module.exports = logger;