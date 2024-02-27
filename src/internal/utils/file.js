import fs from 'fs';
import path from 'path';

/**
 * @param {string} absolutePath
 * @returns {string[]}
 */
export function splitEntrys(absolutePath) {
    return absolutePath.split(path.sep);
}

/**
 * @param  {...string} entrysNames
 * @returns {string}
 */
export function posixJoin(...entrysNames) {
    return entrysNames.join(path.posix.sep);
}

/**
 * @param {string} anyPath
 * @returns {string}
 */
export function toPosix(anyPath) {
    const regex = /[/\\]+$/;
    const outputPath = anyPath.replace(regex, '');
    return outputPath.split(path.sep).join('/');
}

/**
 * @param {string} absPath
 * @returns {unknown | undefined}
 */
export function readJSON(absPath) {
    if (!absPath) {
        console.log(`to read a json mus provide a valid string path, provided path='${path}'`);
        return undefined;
    }
    /** @type {string} */
    let content;
    try {
        content = fs.readFileSync(absPath, { encoding: 'utf-8' });
    } catch (error) {
        if (!isNodeJSError(error)) throw error;
        switch (error.code) {
            case 'ENOENT':
                console.log(`File at '${absPath}' does not exist`);
                break;
            case 'EACCES':
                console.log(`Permission denied to read ${path}`);
                break;
            default:
                console.log(`Unhandled error, code: ${error.code}, message: ${error.message}`);
                break;
        }
        return undefined;
    }
    try {
        return JSON.parse(content);
    } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        console.log(`Syntax error when trying to parse json at '${path}'`);
        return undefined;
    }
}

/**
 * @template {unknown} T
 * @param {string} absPath
 * @param {T} value
 * @returns {boolean}
 */
export function writeJSON(absPath, value) {
    if (!absPath) {
        console.log(`to save a json mus provide a valid string path, provided path='${path}'`);
        return false;
    }
    try {
        fs.writeFileSync(absPath, JSON.stringify(value, null, 2), { encoding: 'utf-8' });
        return true;
    } catch (error) {
        if (error instanceof TypeError) {
            console.log(`Type error when trying to JSON.stringify a value`);
            return false;
        }
        if (!isNodeJSError(error)) throw error;
        switch (error.code) {
            case 'ENOENT':
                console.log(`Directory at '${absPath}' does not exist`);
                break;
            case 'EACCES':
                console.log(`Permission denied to read ${path}`);
                break;
            default:
                console.log(`Unhandled error, code: ${error.code}, message: ${error.message}`);
                break;
        }
        return false;
    }
}

/**
 * @typedef {{
 *  name: string;
 *  absolutePath: URL;
 *  parent?:EntryDirectory}} EntryData
 */


export const entryType = {
    DIRECTORY: /** @type {'DIRECTORY'}*/(`DIRECTORY`),
    FILE: /** @type {'FILE'}*/('FILE'),
    ANY: /** @type {'ANY'}*/('ANY')
};

/**
 * @typedef {typeof entryType[keyof typeof entryType]} EntryTypes
 */

/**
 * @typedef {{
 *  DIRECTORY: EntryDirectory;
 * FILE: EntryFile;
 * ANY: EntryDirectory | EntryFile;
 * }} EntryTypeMapper
 */

/**
 * @interface EntryData
 */

/**
 * @typedef {EntryData & {
 * module?: {};
 * }} FileData
 */


/**
 * @satisfies {FileData}
 */
export class EntryFile {
    /** @readonly */
    type = entryType.FILE;
    /**
     * @type {string}
     * @readonly
     */
    name;
    /**
     * @type {URL}
     * @readonly
     */
    absolutePath;
    /**
     * @type {EntryDirectory | undefined}
     */
    parent;
    /** @type {{} | undefined} */
    module;

    /**
     * @param {FileData} param0
     */
    constructor({ name, absolutePath, parent, module }) {
        this.name = name;
        this.absolutePath = absolutePath;
        this.parent = parent;
        this.module = module;
    }
}

/**
 * @typedef {EntryData & {
 * entries: Entry[];
 * }} DirectoryData
 */

/**
 * @satisfies {DirectoryData}
 */
export class EntryDirectory {
    /** @readonly */
    type = entryType.DIRECTORY;
    /**
     * @type {string}
     * @readonly
     * */
    name;
    /**
     * @type {URL}
     * @readonly
     * */
    absolutePath;
    /**
     * @type {EntryDirectory | undefined}
     * @readonly
     * */
    parent;
    /**
     * @type {Entry[]}
     * */
    entries;

    /**
     * @param {DirectoryData} param0
     * */
    constructor({ name, absolutePath, parent, entries }) {
        this.name = name;
        this.absolutePath = absolutePath;
        this.parent = parent;
        this.entries = entries;
    }

    /**
     * @template {EntryTypes} T
     * @param {string} entryName
     * @param {T} [type]
     * @returns {EntryTypeMapper[T] | undefined}
     * */
    get(entryName, type) {
        const actualType = type ?? entryType.ANY;
        for (const entry of this.entries) {
            if (entry.name === entryName && (actualType === entryType.ANY || entry.type === actualType))
                return /** @type {EntryTypeMapper[T]} */(entry);
        }
        return undefined;
    }

    /**
     * @template {EntryTypes} T
     * @param {string} entryName
     * @param {T} [type]
     * @returns {EntryTypeMapper[T] | undefined}
     * */
    deepGet(entryName, type) {
        if (!type) type = /** @type {T} */(entryType.ANY);
        for (const entry of this.entries) {
            if (entry.name === entryName && (type === entryType.ANY || entry.type === type))
                return /** @type {EntryTypeMapper[T]} */(entry);
        }
        for (const entry of this.entries) {
            if (entry.type === entryType.DIRECTORY) {
                const deeper = entry.deepGet(entryName, type);
                if (deeper) return deeper;
            }
        }
        return undefined;
    }

    /**
     * @returns {boolean}
     */
    isEmpty() {
        return this.entries.length === 0;
    }

    copy() {
        /** @type {Entry[]} */
        const newEntries = [];
        for (const entry of this.entries) {
            if (entry.type === 'DIRECTORY')
                newEntries.push(entry.copy());
            else
                newEntries.push({ ...entry });
        }
        const newObject = new EntryDirectory(this);
        newObject.entries = newEntries;
        return newObject;
        // return new EntryDirectory({ ...this, entries: newEntries });
        // return structuredClone(this);
    }

    /**
     * @template {EntryTypes} T
     * @param {string | RegExp} name
     * @param {T} [type]
     * @returns {EntryTypeMapper[T] | undefined}
     * */
    extract(name, type) {
        const actualType = type ?? entryType.ANY;
        // https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
        const re = typeof name === 'string' ? new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) : name;
        /** @type {EntryTypeMapper[T] | undefined} */
        let foundEntry;
        let foundIndex = -1;
        for (let index = 0; index < this.entries.length; index++) {
            const entry = this.entries[index];
            if (!(re.test(entry.name) && (actualType === entryType.ANY || entry.type === actualType))) continue;

            foundIndex = index;
            foundEntry = /** @type {EntryTypeMapper[T]} */(entry);
            break;
        }
        if (!foundEntry) return undefined;

        this.entries.splice(foundIndex, 1);
        return foundEntry;
    }
}


/**
 * @typedef {EntryDirectory | EntryFile} Entry
 */

/**
 * @param {any} error
 * @returns {error is NodeJS.ErrnoException}
 */
function isNodeJSError(error) {
    return (error?.code !== undefined);
}


/**
 * @param {URL} absPath
 * @returns {EntryFile | undefined}
 */
export function fileEntry(absPath) {
    if (!absPath) {
        console.log(`to read a file must provide a valid string path, provided path='${path}'`);
        return undefined;
    }

    /** @type {fs.Stats} */
    let stats;
    try {
        stats = fs.statSync(absPath);
    } catch (error) {
        if (!isNodeJSError(error)) throw error;
        switch (error.code) {
            case 'ENOENT':
                console.log(`File at '${absPath}' does not exist`);
                break;
            case 'EACCES':
                console.log(`Permission denied to read ${path}`);
                break;
            default:
                console.log(`Unhandled error, code: ${error.code}, message: ${error.message}`);
                break;
        }
        return undefined;
    }
    if (!stats.isFile()) {
        return undefined;
    }

    return new EntryFile({
        name: path.basename(absPath.href),
        absolutePath: absPath
    });
}

/**
 * @typedef {{
 *  parentDir?: EntryDirectory;
 *  fileNamePattern?: RegExp,
 *   dirNamePattern?: RegExp;
 * }} BaseScanOptions
 */

/**
 * @typedef {BaseScanOptions & {
 * absPath: string;
 * }} _DeepScanOptions
 */

/**
 * @typedef {{
 * absolutePath: URL;
 * components?: undefined;
 * }} PathByAbsolutePath
 */

/**
 * @typedef {{
 * absolutePath?: undefined;
 * components: string[];
 * }} PathByComponents
 */

/**
 * @typedef {BaseScanOptions & (PathByAbsolutePath | PathByComponents)} DeepScanOptions
 */

/**
 * @param {DeepScanOptions} param0
 * @returns {Entry[] | undefined}
 */
function _deepScan({ parentDir, absolutePath, fileNamePattern, dirNamePattern }) {
    if (!absolutePath) {
        console.log(`to scan a directory must provide a valid string path, provided path='${path}'`);
        return undefined;
    }
    /** @type {fs.Dirent[]} */
    let entrys;
    try {
        entrys = fs.readdirSync(absolutePath, { withFileTypes: true });
    } catch (error) {
        if (!isNodeJSError(error)) throw error;
        switch (error.code) {
            case 'ENOENT':
                console.log(`Directory at '${absolutePath}' does not exist`);
                break;
            case 'EACCES':
                console.log(`Permission denied to read ${path}`);
                break;
            default:
                console.log(`Unhandled error, code: ${error.code}, message: ${error.message}`);
                break;
        }
        return undefined;
    }
    if (entrys.length === 0) return [];

    entrys = entrys.filter(entry =>
        entry.isDirectory() && (!dirNamePattern || dirNamePattern.test(entry.name)) ||
        entry.isFile() && (!fileNamePattern || fileNamePattern.test(entry.name))
    );

    /** @type {Entry[]} */
    const dirEntries = [];
    for (const entry of entrys) {
        const newEntry = {
            name: entry.name,
            absolutePath: posixJoin(absolutePath.href, entry.name),
            parent: parentDir
        };
        if (entry.isFile()) {
            dirEntries.push(new EntryFile(newEntry));
            continue;
        }
        if (!entry.isDirectory()) continue;

        const innerScan = _deepScan({ absolutePath: new URL(newEntry.absolutePath), fileNamePattern, dirNamePattern });
        if (!innerScan) continue;

        dirEntries.push(new EntryDirectory({
            ...newEntry,
            entries: innerScan
        }));
    }
    return dirEntries;
}

/**
 * @param {DeepScanOptions} param0
 * @returns {EntryDirectory | undefined}
 */
export function deepScan({ parentDir, absolutePath, components, fileNamePattern, dirNamePattern }) {
    if (!absolutePath && (!components || components.length === 0)) {
        console.log(`to scan a directory must provide a string path or components of a path, provided path='${path}' and components='${components}'`);
        return undefined;
    }

    const scanPath = absolutePath ?? new URL(components.join(path.posix.sep));
    const baseName = scanPath.pathname.split('/').pop() ?? '';
    const innerScan = _deepScan({ absolutePath: new URL(scanPath), fileNamePattern, dirNamePattern });

    return new EntryDirectory({
        name: baseName,
        absolutePath: scanPath,
        parent: parentDir,
        entries: innerScan ?? []
    });
}

/**
 * @template {unknown} T
 * @typedef {{
 * success: true;
 * module: T;
 * }} ImportSuccess
 */

export const importErrors = {
    pathError: `empty path`,
    unableToImport: `unable to import`,
    exeption: `exception thrown`,
    imcompatible: `imported module didn't match the schema`
};

/**
 * @template {string} Message
 * @typedef {{
*  success: false,
*  error: Message;
*  exception?: Error | import('zod').ZodError;
*}} ImportError
 */

/**
 * @template {unknown} I
 * @typedef {ImportSuccess<I> | ImportError<string>} ImportReturnType
 */

/**
 * @template {unknown} T
 * @param {string} filePath
 * @returns {Promise<ImportReturnType<T>>}
 */
/**
 * @template {unknown} T
 * @param {string} filePath
 * @param {import('zod').Schema} schema
 * @returns {Promise<ImportReturnType<T>>}
 */
/**
 * @template {unknown} T
 * @param {string} filePath
 * @param {import('zod').Schema} [schema]
 * @returns {Promise<ImportReturnType<T | unknown>>}
 */
export async function importModule(filePath, schema) {
    if (!filePath)
        return {
            success: false,
            error: importErrors.pathError
        };

    const rawModule = await import(filePath).catch(error => ({ _isError: true, error }));
    if (!rawModule)
        return {
            success: false,
            error: importErrors.unableToImport
        };
    if (rawModule._isError)
        return {
            success: false,
            error: importErrors.exeption,
            exception: rawModule.error
        };

    if (!schema)
        return {
            success: true,
            module: rawModule
        };

    const parsedModule = schema.safeParse(rawModule);
    if (!parsedModule.success)
        return {
            success: false,
            error: importErrors.imcompatible,
            exception: parsedModule.error
        };

    return {
        success: true,
        module: rawModule
    };
}

/**
 * @template {unknown} T
 * @param {string} filePath
 * @param {import('zod').Schema} schema
 * @returns {Promise<ImportReturnType<T>>}
 */
export async function importModuleWithZod(filePath, schema) {
    if (!filePath)
        return {
            success: false,
            error: importErrors.pathError
        };

    const rawModule = await import(filePath).catch(error => ({ _isError: true, error }));
    if (!rawModule || rawModule._isError)
        return {
            success: false,
            error: !rawModule ? importErrors.unableToImport : importErrors.exeption,
            exception: rawModule?.error
        };

    const parsedModule = schema.safeParse(rawModule);
    if (!parsedModule.success)
        return {
            success: false,
            error: importErrors.imcompatible,
            exception: parsedModule.error
        };

    return {
        success: true,
        module: rawModule
    };
}


/**
 * @typedef {{
 * type: 'any' | 'dir' | 'file';
 * fileNamePattern?: RegExp,
 * dirNamePattern?: RegExp;
 * } & (PathByAbsolutePath | PathByComponents)} DeepListDirOptions
 */

/**
 * @param {DeepListDirOptions} param0
 * @returns {string[] | undefined}
 */
export function deepList({ type = 'any', absolutePath, components, fileNamePattern, dirNamePattern }) {
    if (absolutePath === '' || components?.length === 0) {
        console.log(`to scan a directory must provide a string path or components of a path, provided path='${path}' and components='${components}'`);
        return undefined;
    }

    const scanPath = absolutePath ?? components.join(path.posix.sep);
    try {
        let entrys = fs.readdirSync(scanPath, { withFileTypes: true });
        if (entrys.length === 0) return [];

        entrys = entrys.filter(entry =>
            entry.isDirectory() && (!dirNamePattern || dirNamePattern.test(entry.name)) ||
            entry.isFile() && (!fileNamePattern || fileNamePattern.test(entry.name))
        );

        /** @type {string[]} */
        const deeperEntrys = [];
        for (const entry of entrys) {
            if (!entry.isDirectory()) continue;

            const innerScan = deepList({ type, components: [scanPath.toString(), entry.name], fileNamePattern, dirNamePattern });
            if (!innerScan) continue;

            deeperEntrys.push(...innerScan.map(pathTail => path.posix.join(entry.name, pathTail)));
        }

        if (type === 'file')
            entrys = entrys.filter(entry => entry.isFile());
        if (type === 'dir')
            entrys = entrys.filter(entry => entry.isDirectory());

        return [...entrys.map(fileEntry => fileEntry.name), ...deeperEntrys];
    } catch (error) {
        if (!isNodeJSError(error)) throw error;
        switch (error.code) {
            case 'ENOENT':
                console.log(`Directory at '${absolutePath}' not exist`);
                break;
            case 'EACCES':
                console.log(`Permission denied to read ${path}`);
                break;
            default:
                console.log(`Unhandled error, code: ${error.code}, message: ${error.message}`);
                break;
        }
        return undefined;
    }
}
