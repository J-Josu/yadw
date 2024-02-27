export { registerCommands } from './command.js';

/**
 * @typedef {import('./private.js').GenericSubCommandDefinition} BaseCommandDefinition
 * @typedef {import('./private.js').GroupSetupDefinition} GroupSetupDefinition
 * @typedef {import('./private.js').InteractionReply} InteractionReply
 * @typedef {import('./private.js').MultiFileCommandDefinition} MultiFileCommandDefinition
 * @typedef {import('./private.js').SingleFileCommandDefinition} SingleFileCommandDefinition
 * @typedef {import('./private.js').SlashCommandTrait} SlashCommandTrait
 * @typedef {import('./private.js').SubCommandGroupDefinition} SubCommandGroupDefinition
 */

/**
 * @template {MultiFileCommandDefinition} T
 * @typedef {import('./private.js').SubCommandDefinitionFrom<T>} SubCommandDefinitionFrom
 */
