import { SlashCommandBuilder } from 'discord.js';
import { z } from 'zod';
import { INTERACTION } from '../config.js';
import { env } from '../environment.js';
import { f, log } from '../utils/index.js';
import { fsConfig } from './config.js';
import { pathToFileURL } from 'url';

const singleFileCommandSchema = z.object({
    default: z
        .function()
        .returns(z.object({
            data: z.object({}),
            permissions: z.optional(z.array(z.bigint())),
            execute:
                z.function(
                    z.tuple([z.object({
                        client: z.object({}),
                        interaction: z.object({})
                    })]),
                    z.promise(z.unknown())
                ),
        })),
});
// type test = z.infer<typeof singleFileCommandSchema>;

const multiFileCommandSchema = z.object({
    default: z
        .function()
        .returns(z.object({
            data: z.object({}),
            permissions: z.optional(z.array(z.bigint())),
            execute: z.optional(
                z.function(
                    z.tuple([z.object({
                        client: z.object({}),
                        interaction: z.object({})
                    })]),
                    z.promise(z.unknown())
                )
            ),
            subCommandArgs: z.optional(
                z.tuple([]).or(z.tuple([z.unknown()]).rest(z.unknown()))
            )
        })),
});
// type test = z.infer<typeof directoryCommandSchema>;

const subCommandGroupSchema = z.object({
    default: z
        .function()
        .returns(z.object({ data: z.object({}), })),
});
// type test = z.infer<typeof subCommandGroupSchema>;

const subCommandSchema = z.object({
    default: z
        .function()
        .returns(z.object({
            data: z.object({}),
            execute: z.optional(
                z.function(
                    z.tuple([z.object({
                        client: z.object({}),
                        interaction: z.object({})
                    })]),
                    z.promise(z.unknown())
                )
            ),
        })),
});
// type test = z.infer<typeof subCommandSchema>;

const groupSetupSchema = z.object({
    config: z.object({
        categories: z.optional(z.array(z.string())),
        permissions: z.optional(z.array(z.bigint())),
        description: z.optional(z.record(z.string())),
    }),
});
// type test = z.infer<typeof commandSetupModuleSchema>;


/**
 *
 * @param {f.EntryDirectory | f.EntryFile} entry
 * @param {AccumulatedSetup} [accumulatedSetup]
 */
// eslint-disable-next-line no-unused-vars
async function proccessReservedEntry(entry, accumulatedSetup) {
    // log.dev(`reserved entry not processed, entry:\n${JSON.stringify(entry, null, 2)}\n`);
}


/**
 * @typedef {{
 *  file: f.EntryFile,
 * module: import('./private.js').GenericSubCommandModule
 * }} RawSubCommand
 */

/**
 * @typedef {{
 * file: f.EntryFile,
 * module: import('./private.js').SubCommandGroupModule,
 * subCommands: RawSubCommand[]
 * }} RawSubCommandGroup
 */


/**
 * @param {f.EntryDirectory} directory
 * @returns {Promise<RawSubCommandGroup | undefined>}
 */
async function processSubCommandGroup(directory) {
    const setupEntry = directory.extract(fsConfig.subCommandGroupSetup.re, fsConfig.subCommandGroupSetup.type);
    if (!setupEntry) return undefined;

    const setupModule = await f.importModule(setupEntry.absolutePath, subCommandGroupSchema);
    if (!setupModule.success) {
        log.warn(`import error: ${setupModule.error}\n  path > ${setupEntry.absolutePath}\n  exception? > ${setupModule.exception?.cause ?? setupModule.exception?.stack}`);
        return undefined;
    }

    /** @type {RawSubCommand[]} */
    const subCommands = [];
    for (const entry of directory.entries) {
        if (
            fsConfig.skiped.re.test(entry.name) ||
            fsConfig.reserved.re.test(entry.name) ||
            entry.type === f.entryType.DIRECTORY
        ) {
            continue;
        }

        const subCommandModule = await f.importModule(entry.absolutePath, subCommandSchema);
        if (!subCommandModule.success) {
            log.warn(`import error: ${subCommandModule.error}\n  path > ${entry.absolutePath}\n  exception? > ${subCommandModule.exception?.cause ?? subCommandModule.exception?.stack}`);
            continue;
        }

        subCommands.push({ file: entry, module: /** @type {import('./private.js').GenericSubCommandModule}*/(subCommandModule.module) });
    }

    if (subCommands.length === 0) {
        log.warn(`skiped empty directory while loading commands at '${directory.absolutePath}'`);
        return undefined;
    }

    return {
        file: setupEntry,
        module: /** @type {import('./private.js').SubCommandGroupModule}*/(setupModule.module),
        subCommands: subCommands
    };
}

/**
 * @typedef {{
 * categories: Set<string>,
 * permission: bigint
 * }} AccumulatedSetup
 */

/**
 * @typedef {{
 * categories?: Set<string>,
 * permission?: bigint,
 * description?: Record<string, string>
 * }} GroupSetup
 */


class SubCommand {
    /** @type {f.EntryFile} */
    file;
    /** @type {import('./private.js').GenericSubCommandModule}*/
    module;
    /** @type {ReturnType<import('./private.js').GenericSubCommandDefinition>} */
    value;
    /** @type {ReturnType<import('./private.js').GenericSubCommandDefinition>['execute']} */
    execute;

    /**
     * @param {f.EntryFile} file
     * @param {import('./private.js').GenericSubCommandModule} module
     * @param {unknown[]} [args]
     */
    constructor(file, module, args) {
        this.file = file;
        this.module = module;
        this.value = args ? module.default(...args) : module.default();
        this.execute = this.value.execute;
    }

    get data() {
        return this.value.data;
    }
}

class SubCommandGroup {
    /** @type {f.EntryFile} */
    file;
    /** @type {import('./private.js').SubCommandGroupModule}*/
    module;
    /** @type {ReturnType<import('./private.js').SubCommandGroupDefinition>} */
    value;
    /** @type {SubCommand[]} */
    subCommands;

    /**
     * @param {f.EntryFile} file
     * @param {import('./private.js').SubCommandGroupModule} module
     */
    constructor(file, module) {
        this.file = file;
        this.module = module;
        this.value = module.default();
        this.subCommands = [];
    }

    get data() {
        return this.value.data;
    }

    /**
     * @param {SubCommand} subCommand
     */
    addSubCommand(subCommand) {
        this.subCommands.push(subCommand);
        this.data.addSubcommand(subCommand.data);
    }
}

/**
 * @param {bigint} [accumulated]
 * @param {bigint[]} [news]
 * @returns {bigint | undefined}
 */
function reducePermissions(accumulated, news) {
    let reduced = accumulated ?? 0n;
    if (news) {
        for (const permission of news)
            reduced |= permission;
    }
    return reduced !== 0n ? reduced : undefined;
}


/**
 * @satisfies {import('./private.js').SlashCommandTrait}
 */
class MultiFileCommand {
    /** @type {string} */
    name;
    /** @type {f.EntryFile} */
    setupFile;
    /** @type {import('./private.js').MultiFileCommandModule} */
    module;
    /** @type {ReturnType<import('./private.js').MultiFileCommandDefinition>} */
    value;
    /** @type {Map<string, SubCommand>} */
    #executionMap;

    /**
     * @param {string} name
     * @param {f.EntryFile} setupFile
     * @param {import('./private.js').MultiFileCommandModule} module
     * @param {RawSubCommandGroup[]} subCommandsGroups
     * @param {RawSubCommand[]} subCommands
     * @param {GroupSetup} [config]
     */
    constructor(name, setupFile, module, subCommandsGroups, subCommands, config) {
        this.name = name;
        this.setupFile = setupFile;
        this.module = module;
        this.value = module.default();

        if (this.name !== this.value.data.name) {
            throw new Error(`command name '${this.name}' does not match with the name '${this.value.data.name}' defined in the command file '${this.setupFile.absolutePath}'`);
        }

        this.#executionMap = new Map();

        for (const rawSubCommandGroup of subCommandsGroups) {
            const subCommandGroup = new SubCommandGroup(rawSubCommandGroup.file, rawSubCommandGroup.module);
            for (const rawSubCommand of rawSubCommandGroup.subCommands) {
                const subCommand = new SubCommand(rawSubCommand.file, rawSubCommand.module, this.value.subCommandsArgs);
                subCommandGroup.addSubCommand(subCommand);
                this.#executionMap.set(`${subCommandGroup.data.name}.${subCommand.data.name}`, subCommand);
            }
            this.value.data.addSubcommandGroup(subCommandGroup.data);
        }

        for (const rawSubCommand of subCommands) {
            const subCommand = new SubCommand(rawSubCommand.file, rawSubCommand.module, this.value.subCommandsArgs);
            this.value.data.addSubcommand(subCommand.data);
            this.#executionMap.set(subCommand.data.name, subCommand);
        }

        this.value.data.setDefaultMemberPermissions(reducePermissions(config?.permission, this.value.permissions));
    }

    get data() {
        return this.value.data;
    }

    /**
     * @param {import('./private.js').CommandCallbackArgs} arg
     * @returns {Promise<unknown>}
     */
    async execute(arg) {
        const groupName = arg.interaction.options.getSubcommandGroup();
        const subCommandName = arg.interaction.options.getSubcommand();
        const subCommand = /** @type {SubCommand} */(this.#executionMap.get(groupName ? `${groupName}.${subCommandName}` : subCommandName));

        if (!this.value.execute) {
            return subCommand.execute(arg);
        }

        const preExecutionResult = await this.value.execute(arg);
        if (!preExecutionResult)
            throw new Error('Error when handling command');

        return subCommand.execute(arg);
    }
}

/**
 * @param {f.EntryDirectory} directory
 * @param {GroupSetup} accumulatedSetup
 * @returns {Promise<MultiFileCommand | undefined>}
 */
async function proccesMultiFileCommand(directory, accumulatedSetup) {
    const setupEntry = directory.extract(fsConfig.commandSetup.re, fsConfig.commandSetup.type);
    if (!setupEntry) return undefined;

    const setupModule = /** @type {f.ImportReturnType<import('./private.js').MultiFileCommandModule>}*/(await f.importModule(setupEntry.absolutePath, multiFileCommandSchema));
    if (!setupModule.success) {
        log.warn(`import error: ${setupModule.error}\n  path > ${setupEntry.absolutePath}\n  exception? > ${setupModule.exception?.cause ?? setupModule.exception?.stack}`);
        return undefined;
    }

    /** @type {RawSubCommandGroup[]} */
    const subCommandsGroups = [];
    /** @type {RawSubCommand[]} */
    const subCommands = [];
    for (const entry of directory.entries) {
        if (fsConfig.skiped.re.test(entry.name)) {
            continue;
        }

        if (entry.type === f.entryType.DIRECTORY) {
            if (!fsConfig.subCommandGroup.re.test(entry.name)) {
                continue;
            }

            const result = await processSubCommandGroup(entry);
            if (!result) continue;

            subCommandsGroups.push(result);
        }

        const subCommandModule = /** @type {f.ImportReturnType<import('./private.js').GenericSubCommandModule>}*/(await f.importModule(entry.absolutePath, subCommandSchema));
        if (!subCommandModule.success) {
            log.warn(`import error: ${subCommandModule.error}\n  path > ${entry.absolutePath}\n  exception? > ${subCommandModule.exception?.cause ?? subCommandModule.exception?.stack}`);
            continue;
        }

        subCommands.push({ file: /** @type {f.EntryFile} */(entry), module: subCommandModule.module });
    }

    if (subCommandsGroups.length === 0 && subCommands.length === 0) {
        log.warn(`skiped empty directory while loading commands at '${directory.absolutePath}'`);
        return undefined;
    }

    const name = directory.name;
    return new MultiFileCommand(name, setupEntry, setupModule.module, subCommandsGroups, subCommands, accumulatedSetup);
}

/**
 * @satisfies {import('./private.js').SlashCommandTrait}
 */
class SingleFileCommand {
    /** @type {string} */
    name;
    /** @type {f.EntryFile} */
    file;
    /** @type {import('./private.js').SingleFileCommandModule}*/
    module;
    /** @type {ReturnType<import('./private.js').SingleFileCommandDefinition>} */
    value;
    /** @type {ReturnType<import('./private.js').SingleFileCommandDefinition>['execute']} */
    execute;

    /**
     * @param {string} name
     * @param {f.EntryFile} file
     * @param {import('./private.js').SingleFileCommandModule} module
     * @param {GroupSetup} [config]
     * @param {unknown[]} [args]
     */
    constructor(name, file, module, config, args) {
        this.name = name;
        this.file = file;
        this.module = module;
        this.value = module.default(...args ?? []);

        if (this.name !== this.value.data.name) {
            throw new Error(`command name '${this.name}' does not match with the name '${this.value.data.name}' defined in the command file '${this.file.absolutePath}'`);
        }

        const newPermission = reducePermissions(config?.permission, this.value.permissions);

        if (this.value.data instanceof SlashCommandBuilder) {
            this.value.data.setDefaultMemberPermissions(newPermission);
        }

        this.execute = this.value.execute;
    }

    get data() {
        return this.value.data;
    }
}

/**
 * @typedef {SingleFileCommand | MultiFileCommand} Command
 */

export class Group {
    /** @type {string} */
    name;
    /** @type {f.EntryFile | undefined} */
    file;
    /** @type {import('./private.js').GroupSetupModule | undefined} */
    module;
    /** @type {import('./private.js').GroupSetupDefinition} */
    value;
    /** @type {Group[]} */
    innerGroups;
    /** @type {Command[]} */
    commands;

    /**
     * @param {string} name
     * @param {f.EntryFile | undefined} file
     * @param {import('./private.js').GroupSetupModule | undefined} module
     * @param {import('./private.js').GroupSetupDefinition} value
     * @param {Group[]} innerGroups
     * @param {Command[]} commands
     */
    constructor(name, file, module, value, innerGroups, commands) {
        this.name = name;
        this.file = file;
        this.module = module;
        this.value = value;
        this.innerGroups = innerGroups;
        this.commands = commands;
    }

    flattenCommands() {
        const commands = this.commands.slice();
        for (const group of this.innerGroups) {
            for (const command of group.flattenCommands()) {
                commands.push(command);
            }
        }
        return commands;
    }
}

/**
 * @satisfies {GroupSetup}
 */
const defaultGroupSetup = {
    categories: new Set(),
    permission: 0n
};

/**
 * @param {f.EntryDirectory} directory
 * @param {AccumulatedSetup} accumulatedSetup
 * @returns {Promise<Group | undefined>}
 */
async function processDirectoryGroup(directory, accumulatedSetup) {
    const setupEntry = directory.extract(fsConfig.groupSetup.re, fsConfig.groupSetup.type);

    /** @type {import('./private.js').GroupSetupDefinition} */
    let setupModule = defaultGroupSetup;
    /** @type {AccumulatedSetup & Pick<import('./private.js').GroupSetupDefinition, 'description'>} */
    let actualSetup = accumulatedSetup;

    if (setupEntry) {
        const setup = /** @type {f.ImportReturnType<import('./private.js').GroupSetupModule>} */
            (await f.importModule(setupEntry.absolutePath, groupSetupSchema));
        if (setup.success) {
            setupModule = setup.module.config;
            actualSetup = {
                categories: new Set(...accumulatedSetup.categories, ...setupModule.categories ?? []),
                permission: setupModule.permissions?.reduce((prev, crr) => prev | crr, accumulatedSetup.permission) ?? accumulatedSetup.permission,
                description: setupModule.description
            };
        }
    }

    /** @type {Group[]} */
    const innerGroups = [];
    /** @type {Command[]} */
    const commands = [];
    for (const entry of directory.entries) {
        if (fsConfig.skiped.re.test(entry.name)) {
            continue;
        }

        if (fsConfig.reserved.re.test(entry.name)) {
            proccessReservedEntry(entry, actualSetup);
            continue;
        }

        if (entry.type === f.entryType.DIRECTORY) {
            if (fsConfig.group.re.test(entry.name)) {
                const result = await processDirectoryGroup(entry, actualSetup);
                if (!result) continue;

                innerGroups.push(result);
                continue;
            }

            const result = await proccesMultiFileCommand(entry, actualSetup);
            if (!result) continue;

            commands.push(result);
            continue;
        }

        const commandModule = /** @type {f.ImportReturnType<import('./private.js').SingleFileCommandModule>} */
            (await f.importModule(entry.absolutePath, singleFileCommandSchema));
        if (!commandModule.success) {
            log.warn(`import error: ${commandModule.error}\n  path > ${entry.absolutePath}\n  exception? > ${commandModule.exception?.cause ?? commandModule.exception?.stack}`);
            continue;
        }

        const name = entry.name.slice(0, entry.name.length - 3);
        commands.push(new SingleFileCommand(name, entry, commandModule.module, actualSetup));
    }

    if (innerGroups.length === 0 && commands.length === 0) {
        log.warn(`skiped empty directory while loading commands at '${directory.absolutePath}'`);
        return undefined;
    }

    const name = directory.name.slice(1, directory.name.length - 1);
    return new Group(name, setupEntry, /** @type {any} */(setupModule), actualSetup, innerGroups, commands);
}

/**
 * @param {f.EntryDirectory} directory
 * @param {AccumulatedSetup} [previus]
 * @returns {Promise<{ setup: AccumulatedSetup, setupEntry?: f.EntryFile, setupModule?: import('./private.js').GroupSetupModule }>}
 */
async function loadGroupSetup(directory, previus) {
    const setup = { ...(previus ?? defaultGroupSetup) };
    const setupEntry = directory.extract(fsConfig.groupSetup.re, fsConfig.groupSetup.type);
    if (!setupEntry) return { setup };

    const result = /** @type {f.ImportReturnType<import('./private.js').GroupSetupModule>} */
        (await f.importModule(setupEntry.absolutePath, groupSetupSchema));
    if (!result.success) return { setup };

    const module = result.module;
    if (module.config.categories)
        setup.categories = new Set(...setup.categories, module.config.categories);

    if (module.config.permissions)
        for (const permission of module.config.permissions)
            setup.permission |= permission;

    return { setup, setupEntry, setupModule: module };
}

/**
 * @param {f.EntryDirectory} baseDir
 * @returns {Promise<{ commandsDirectory: f.EntryDirectory, result: Group, flattenedCommands: Command[] } | undefined>}
 */
async function processCommandsDirectory(baseDir) {
    const baseDirCopy = baseDir.copy();
    const { setup, setupEntry, setupModule } = await loadGroupSetup(baseDirCopy);

    /** @type {Group[]} */
    const innerGroups = [];
    /** @type {Command[]} */
    const commands = [];
    for (const entry of baseDirCopy.entries) {
        if (fsConfig.skiped.re.test(entry.name))
            continue;

        if (fsConfig.reserved.re.test(entry.name)) {
            proccessReservedEntry(entry, setup);
            continue;
        }

        if (entry.type === f.entryType.DIRECTORY) {
            if (fsConfig.group.re.test(entry.name)) {
                const result = await processDirectoryGroup(entry, setup);
                if (!result) continue;

                innerGroups.push(result);
                continue;
            }

            const result = await proccesMultiFileCommand(entry, setup);
            if (!result) continue;

            commands.push(result);
            continue;
        }

        const commandModule = /** @type {f.ImportReturnType<import('./private.js').SingleFileCommandModule>} */
            (await f.importModule(entry.absolutePath, singleFileCommandSchema));
        if (!commandModule.success) {
            log.warn(`import error: ${commandModule.error}\n  path > ${entry.absolutePath}\n  exception? > ${commandModule.exception?.cause ?? commandModule.exception?.stack}`);
            continue;
        }

        const name = entry.name.slice(0, entry.name.length - 3);
        commands.push(new SingleFileCommand(name, entry, commandModule.module, setup));
    }

    if (innerGroups.length === 0 && commands.length === 0) {
        log.warn(`skiped empty directory while loading commands at '${baseDirCopy.absolutePath}'`);
        return undefined;
    }

    const resultGroup = new Group("root", setupEntry, setupModule, setup, innerGroups, commands);

    return {
        commandsDirectory: baseDir,
        result: resultGroup,
        flattenedCommands: resultGroup.flattenCommands()
    };
}


/**
 * @param {Group} commands
 * @returns {Promise<SingleFileCommand>}
 */
async function loadHelpCommand(commands) {
    const fileEntry = pathToFileURL(INTERACTION.COMMANDS.PATH, (env.dev ? '+help.ts' : '+help.js'));
    f.fileEntry(
        f.posixJoin(
            INTERACTION.COMMANDS.PATH, (env.dev ? '+help.ts' : '+help.js')
        )
    );
    if (!fileEntry) {
        throw new Error(`failed to load help command`);
    }

    fileEntry.parent = commands.file?.parent;

    const module = /** @type {f.ImportReturnType<import('./private.js').SingleFileCommandModule>} */
        (await f.importModule(fileEntry.absolutePath, singleFileCommandSchema));
    if (!module.success) {
        throw new Error(`failed to load help command\n${module.error}`);
    }

    const name = 'help';
    const command = new SingleFileCommand(name, fileEntry, module.module, undefined, [commands]);
    commands.commands.push(command);
    return command;
}


async function loadCommands() {
    const COMMANDS_ABS_DIR = INTERACTION.COMMANDS.PATH;
    const commandsDir = f.deepScan({
        absolutePath: COMMANDS_ABS_DIR,
        fileNamePattern: fsConfig.ignored.file.reNegated,
        dirNamePattern: fsConfig.ignored.dir.reNegated,
    });
    if (!commandsDir || commandsDir.isEmpty()) {
        return undefined;
    }

    const commands = await processCommandsDirectory(commandsDir);
    if (!commands) {
        return undefined;
    }

    // const helpCommand = await loadHelpCommand(commands.result);
    // commands.flattenedCommands.unshift(helpCommand);

    return commands;
}

/**
 * @param {import('../client.js').Client} client
 * @returns {Promise<void>}
 */
export async function registerCommands(client) {
    const loadedCommands = await loadCommands();

    if (!loadedCommands) {
        log.warn(`No commands has been loaded`);
        return;
    }

    /** @type {import('discord.js').ApplicationCommandDataResolvable[]} */
    const commandsData = [];
    /** @type {string[]} */
    const commandsNames = [];

    for (const command of loadedCommands.flattenedCommands) {
        commandsData.push(command.data);
        commandsNames.push(command.data.name);
        client.commands.set(command.data.name, command);
    }

    client.on('ready', async () => {
        if (env.guildId) {
            await client.guilds.cache.get(env.guildId)?.commands.set(commandsData);
        }
        else {
            await client.application?.commands.set(commandsData);
        }

        log.core(`Commands registered (${commandsNames.length})`, commandsNames);
    });
}
