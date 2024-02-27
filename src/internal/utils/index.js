export * as f from './file.js';

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
        fatal: (...args) => {
            console['error'](`${currentArgDateFormatted()} [FATAL]`, ...args);
        },
        core: (...args) => {
            console['log'](`${currentArgDateFormatted()} [CORE]`, ...args);
        }
    };
}

/**
 *
 * @param {string | undefined} env
 * @param {number} defaultValue
 * @returns {number}
 */
export function parseNumber(env, defaultValue) {
    if (!env) {
        return defaultValue;
    }
    const value = parseInt(env);
    if (isNaN(value)) {
        return defaultValue;
    }
    return value;
}

export const log = createLogger(parseNumber(process.env.LOG_LEVEL, 6),true);

/**
 *
 * @param {number} ts
 * @returns
 */
export function tsToRawHsMinS(ts) {
    return ts < 1_000 ? '0s' :
        ts < 60_000 ? `${Math.floor(ts / 1000)}s` :
            ts < 3_600_000 ? `${Math.floor(ts / 60000)}m ${Math.floor((ts / 1000) % 60)}s` :
                `${Math.floor(ts / 3600000)}h ${Math.floor((ts / 60000) % 60)}m ${Math.floor((ts / 1000) % 60)}s`;
}

/**
 * @template {unknown[]} T
 * @param {T[]} array
 * @returns {T}
 */
export function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * @param {`#${string}`} color
 * @returns {number}
 */
export function hexColorToInt(color) {
    return parseInt((color).slice(1), 16);
}

const argFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

/**
 * @param {Date | number | undefined} date
 * @returns {string}
 */
export function dateAsArg(date) {
    return argFormatter.format(date);
}
