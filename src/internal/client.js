import { Collection, Client as DiscordJSClient } from 'discord.js';
import { registerCommands } from './command/index.js';
import { env } from './environment.js';
import { registerEvents } from './event/index.js';
import { log } from './utils/index.js';


export class Client extends DiscordJSClient {
    /** @type {Collection<string, import('./command/private.js').SlashCommandTrait> } */
    commands;
    /** @type {Map<string, import('./private.js').RegisteredTask>}*/
    programedTasks;
    /** @type {Map<string, import('./private.js').RegisteredTask>}*/
    scheduledTasks;
    /** @type {Required<import('../utils/public.js').YADWOptions['path']>} */
    path;

    /**
     * @param {import('../utils/public.js').YADWOptions} options
     */
    constructor(options) {
        super({
            ...options.discordjs,
            intents: options.client.intents,
            partials: options.client.partials,
        });
        this.commands = new Collection();
        this.selectMenus = new Collection();
        this.programedTasks = new Map();
        this.scheduledTasks = new Map();
        this.path = {
            commands: 'src/commands',
            events: 'src/events',
            ...options.path
        };
    }

    async start() {
        await Promise.all([
            registerCommands(this),
            registerEvents(this),
        ]);
        await this.login(env.botToken);
    }

    /**
     * @template {(...args: A) => void} C
     * @template {unknown[]} A
     * @param {import('./private.js').ProgramTaskData<C, A>} param0
     */
    programTask({ name, callback, ms, args, initialize = false }) {
        if (this.programedTasks.has(name)) {
            log.warn(`Task named '${name}' already has been registered with fn='${this.programedTasks.get(name)}'`);
            return;
        }
        const id = setTimeout((...args) => {
            this.programedTasks.delete(name);
            callback(...args);
        }, ms, ...args);
        this.programedTasks.set(name, { callback, id });
        if (initialize)
            callback(...args);
    }

    /** @param {string} name */
    removeProgramedTask(name) {
        const task = this.programedTasks.get(name);
        if (!task) {
            log.warn(`Programed task with name '${name}' is not registered, can't be removed`);
            return;
        }
        this.programedTasks.delete(name);
        try {
            clearTimeout(task.id);
        } catch (error) {
            if (!(error instanceof TypeError))
                throw error;
            log.warn(`Error while clearing a task, invalid id\n  name > ${name}\n  id > ${task.id}\n  callback > ${task.callback}`);
        }
    }

    /**
     * @template {(...args: A) => void} C
     * @template {unknown[]} A
     * @param {import('./private.js').ScheduleTaskData<C, A>} param0
     */
    scheduleTask({ name, callback, interval, args, initialize = false }) {
        if (this.scheduledTasks.has(name)) {
            log.warn(`Task named '${name}' already has been registered with fn='${this.scheduledTasks.get(name)}'`);
            return;
        }
        const id = setInterval(callback, interval, ...args);
        this.scheduledTasks.set(name, { callback, id });
        if (initialize)
            callback(...args);
    }

    /** @param {string} name */
    removeScheduledTask(name) {
        const task = this.scheduledTasks.get(name);
        if (!task) {
            log.warn(`Task with name '${name}' is not registered, can't be removed`);
            return;
        }
        this.scheduledTasks.delete(name);
        try {
            clearInterval(task.id);
        } catch (error) {
            if (!(error instanceof TypeError))
                throw error;
            log.warn(`Error while clearing a task, invalid id\n  name > ${name}\n  id > ${task.id}\n  callback > ${task.callback}`);
        }
    }
}
