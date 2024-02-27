
export const ImportError = {
    PathError: 'Invalid path',
    UnableToImport: 'Unable to import module',
    Exeption: 'Exception while importing module',
    Imcompatible: 'Invalid module structure'
};

/**
 * @typedef {import('./utils/private.js').Values<typeof ImportError>} ImportErrors
 */

/**
 * @typedef {string | URL} PathLike
 */

/**
 * @template {import('zod').Schema} T
 * @typedef {import('zod').TypeOf<T>} ImportReturnType
 */

/**
 * @template {import('zod').Schema} T
 * @param {PathLike} path
 * @param {T} schema
 * @returns {Promise<
 * { success: true, module: T['_output'] } |
 * { success: false, reason: ImportErrors, error?: Error }>
 * }
 */
export async function validatedImport(path, schema) {
    if (!path) {
        return {
            success: false,
            reason: ImportError.PathError
        };
    }
    /** @type {any} */
    let uncheckedModule;
    try {
        uncheckedModule = await import(String(path));
    }
    catch (error) {
        return {
            success: false,
            reason: ImportError.UnableToImport,
            error: /** @type {Error} */(error)
        };
    }
    /**
     * @type {T['_output']}
     */
    let module;
    try {
        module = schema.parse(uncheckedModule);
    }
    catch (error) {
        return {
            success: false,
            reason: ImportError.Exeption,
            error: /** @type {Error} */(error)
        };
    }
    return {
        success: true,
        module: module
    };
}
