import type { ClientOptions, Partials, PresenceData } from 'discord.js';

export interface YADWOptions {
    /**
     * The client options
     */
    client: {
        /**
         * The intents for the client
         * @default {3276799}
         */
        intents: number;
        /**
         * The partials for the client
         * @default [Partials.Channel, Partials.Message, Partials.Reaction]}
         */
        partials: Partials[];
    };
    /**
     * The path for the special directories
     */
    path?: {
        /**
         * The path for the commands
         * @default 'src/commands'
         */
        commands: string;
        /**
         * The path for the events
         * @default {'src/events'}
         */
        events: string;
    };
    /**
     * Reply options
     */
    reply?: {
        botEmbed?: {
            /**
             * The color for the embed
             * @default '#3e639b'
             */
            color?: string;
            /**
             * The color for the embed
             * @default 4088731
             */
            colorInt?: number;
        };
    };
    /**
     * Default value for efhemeral
     */
    efhemeral?: boolean;
    /**
     * The options for Discord.js Client
     */
    discordjs?: ClientOptions;
}

export interface YADWPresence extends PresenceData {
    /**
     * The duration for the presence.
     * Takes precedence over the interval
     */
    duration?: number;
}

export interface YADWPresences {
    /**
     * The presences for the client
     */
    presences: YADWPresence[],
    /**
     * The interval for changing the presences
     */
    interval?: number;
    /**
     * If the presences should be random
     * @default true
     */
    randomOrder?: boolean;
    /**
     * The default presence status
     */
    status?: PresenceData['status'];
}
