const DEFAULT_FORMATTER = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });

/**
 * @param {number} level
 * @param {boolean} [dev]
 * @param {Intl.DateTimeFormat} [formatter]
 */
export function createLogger(level, dev = false, formatter = DEFAULT_FORMATTER) {
    /** @param {Intl.DateTimeFormat} value */
    function setFormatter(value) {
        formatter = value;
    }

    /** @param {boolean} value */
    function setDev(value) {
        dev = value;
    }

    /** @param {number} value */
    function setLevel(value) {
        level = value;
    }

    /** @returns {string} */
    function currentDate() {
        return formatter.format(Date.now());
    }

    const logger = {
        /**
         * Logs only in development mode
         * @param  {...any} args
         */
        dev(...args) {
            if (dev || level >= 5) {
                console['debug'](`${currentDate()} [DEBUG]`, ...args);
            }
        },
        /**
         * Logs in development mode or when log level is 4 or higher
         * @param  {...any} args
         */
        debug(...args) {
            if (dev || level >= 4) {
                console['debug'](`${currentDate()} [DEBUG]`, ...args);
            }
        },
        /**
         * Logs in development mode or when log level is 3 or higher
         * @param  {...any} args
         */
        info(...args) {
            if (level >= 3) {
                console['info'](`${currentDate()} [INFO]`, ...args);
            }
        },
        /**
         * Logs when log level is 2 or higher
         * @param  {...any} args
         */
        warn(...args) {
            if (level >= 2) {
                console['warn'](`${currentDate()} [WARN]`, ...args);
            }
        },
        /**
         * Logs when log level is 1 or higher
         * @param  {...any} args
         */
        error(...args) {
            if (level >= 1) {
                console['error'](`${currentDate()} [ERROR]`, ...args);
            }
        },
        /**
         * Logs always
         * @param  {...any} args
         */
        fatal(...args) {
            console['error'](`${currentDate()} [FATAL]`, ...args);
        },
        /**
         * Logs always
         * @param  {...any} args
         */
        core(...args) {
            console['log'](`${currentDate()} [CORE]`, ...args);
        }
    };

    return {
        logger,
        setFormatter,
        setDev,
        setLevel
    };
}

/**
 * @typedef {ReturnType<typeof createLogger>['logger']} Logger
 */

export const {
    logger,
    setDev,
    setFormatter,
    setLevel
} = createLogger(6);
