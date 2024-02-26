import { z } from 'zod';
import { f } from '../utils/index.js';


const eventSchema = z.object({
    default: z
        .function()
        .returns(z.object({
            once: z.boolean(),
            name: z.string(),
            description: z.string(),
            response: z
                .function(
                    z.tuple([z.object({})]).rest(z.unknown()),
                    z.void()
                )
        }))
});


// /**
//  * @template {import('./public.js').EventNames} N
//  */
// class Event {
//     /** @type {N} */
//     name;
//     /** @type {boolean} */
//     once;
//     /** @type {string} */
//     description;
//     /** @type {import('./public.js').EventCallback<N>} */
//     response;

//     /**
//      * @param {N} eventName
//      * @param {boolean} once
//      * @param {string} description
//      * @param {import('./public.js').EventCallback<N, import('../client').ExtendedClient>} responseFn
//      */
//     constructor(eventName, once, description, responseFn) {
//         this.name = eventName;
//         this.once = once;
//         this.description = description;
//         this.response = responseFn;
//     }
// }

/**
 * @param {import('../client').ExtendedClient} client
 * @returns {Promise<void>}
 */
export async function registerEvents(client) {
    const EVENTS_ABS_DIR = f.posixJoin(
        ...f.splitEntrys(__dirname), '..', '..', 'events'
    );

    const eventsToLoad = f.deepList({
        type: 'file',
        absolutePath: EVENTS_ABS_DIR,
        dirNamePattern: /^[^!+][\w-]+$/,
        fileNamePattern: /^[^!+][\w-]+\.(ts|js)$/,
    });
    if (!eventsToLoad || eventsToLoad.length === 0) {
        // log.warning(`Failed to find events to register`);
        return;
    }

    for (const eventName of eventsToLoad) {
        const EVENT_ABS_PATH = f.posixJoin(EVENTS_ABS_DIR, eventName);

        const importResult = await f.importModuleWithZod(EVENT_ABS_PATH, eventSchema);
        if (!importResult.success) {
            // log.warn(`import error: ${importResult.error}\n  path > ${EVENT_ABS_PATH}\n  exception?.name > ${importResult.exception?.name}`);
            // log.warn(`Event declared at path '${EVENT_ABS_PATH}' has problems, not loaded`);
            continue;
        }

        const event = /** @type {import('./public.js').EventModule} */(importResult.module).default();

        if (event.once)
            client.once(event.name, (...args) => void event.response(client, ...args));
        else
            client.on(event.name, (...args) => void event.response(client, ...args));
    }
}
