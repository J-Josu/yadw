const argDateFormater = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
function currentArgDateFormatted() {
    return argDateFormater.format(Date.now());
}

function logNoop() { }

/** @param  {...any} args */
function logDev(...args) {
    console['log'](`${currentArgDateFormatted()} [DEV]`, ...args);
}

/** @param  {...any} args */
function logDebug(...args) {
    console['debug'](`${currentArgDateFormatted()} [DEBUG]`, ...args);
}

/** @param  {...any} args */
function logInfo(...args) {
    console['info'](`${currentArgDateFormatted()} [INFO]`, ...args);
}

/** @param  {...any} args */
function logWarn(...args) {
    console['warn'](`${currentArgDateFormatted()} [WARN]`, ...args);
}

/** @param  {...any} args */
function logError(...args) {
    console['error'](`${currentArgDateFormatted()} [ERROR]`, ...args);
}

/** @param  {...any} args */
function logFatal(...args) {
    console['error'](`${currentArgDateFormatted()} [FATAL]`, ...args);
}

/** @param  {...any} args */
function logCore(...args) {
    console['log'](`${currentArgDateFormatted()} [CORE]`, ...args);
}

/**
 *
 * @param {number} level
 * @param {boolean} dev
 * @returns {import('./public.js').Logger}
 */
export function createLogger(level, dev) {
    return {
        dev: dev ? logDev : logNoop,
        debug: dev || level >= 4 ? logDebug : logNoop,
        info: dev || level >= 3 ? logInfo : logNoop,
        warn: level >= 2 ? logWarn : logNoop,
        error: level >= 1 ? logError : logNoop,
        fatal: logFatal,
        core: logCore,
    };
}

/**
 *
 * @param {string | undefined} env
 * @param {number} defaultValue
 * @returns {number}
 */
export function numberFromEnv(env, defaultValue) {
    if (!env) {
        return defaultValue;
    }
    const value = parseInt(env);
    if (isNaN(value)) {
        return defaultValue;
    }
    return value;
}
