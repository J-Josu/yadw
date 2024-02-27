import type { APIEmbed, ChatInputCommandInteraction, InteractionReplyOptions, LocaleString, PermissionFlags, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

import type { AnyTuple, Replace, Values } from '../utils/private.js';
import type { Client } from '../client.js';


export type MemberType = {
    Owner: 'Owner',
    Admin: 'Administrator',
    Mod: 'Moderator',
    Normal: 'Normal',
    Visitor: 'Visitor',
};

export type MemberTypeValues = Values<MemberType>;

export type Locals = {
    MemberType: MemberTypeValues;
};

export type CommandCallbackArgs = {
    client: Client;
    interaction: ChatInputCommandInteraction<'cached'>;
    locals: Locals;
};

export type CommandCallback<T = unknown> = (arg: CommandCallbackArgs) => Promise<T>;


type SlashCommandBuilderReturns = SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder;


export type SlashCommandTrait = {
    readonly data: SlashCommandBuilderReturns,
    execute(arg: CommandCallbackArgs): Promise<unknown>;
};


export type CommandPermissions = Values<PermissionFlags>[];


export type SingleFileCommandDefinition<P extends readonly unknown[] = unknown[]> = (...args: P) => {
    readonly data: SlashCommandBuilderReturns;
    readonly permissions?: CommandPermissions;
    execute(arg: CommandCallbackArgs): Promise<unknown>;
};

export type SingleFileCommandModule = { default: SingleFileCommandDefinition; };


export type MultiFileCommandDefinition<P extends readonly unknown[] = unknown[]> = (...args: P) => {
    readonly data: SlashCommandBuilder;
    readonly permissions?: CommandPermissions;
    execute?(arg: CommandCallbackArgs): Promise<unknown>;
    readonly subCommandsArgs?: AnyTuple;
};

export type MultiFileCommandModule = { default: MultiFileCommandDefinition; };


export type SubCommandGroupDefinition = () => {
    readonly data: SlashCommandSubcommandGroupBuilder;
};

export type SubCommandGroupModule = { default: SubCommandGroupDefinition; };


export type GenericSubCommandDefinition<P extends readonly unknown[] = unknown[]> = (...args: P) => {
    readonly data: SlashCommandSubcommandBuilder;
    execute(arg: CommandCallbackArgs): Promise<unknown>;
};

export type GenericSubCommandModule = { default: GenericSubCommandDefinition; };

export type SubCommandDefinitionFrom<T extends MultiFileCommandDefinition, A = ReturnType<T>['subCommandsArgs']> = GenericSubCommandDefinition<A extends AnyTuple ? A : []>;


export type GroupSetupDefinition = {
    readonly permissions?: CommandPermissions;
    readonly categories?: Set<string>;
    readonly description?: Partial<Record<LocaleString, string>> & { "en-US": string; };
};

export type GroupSetupModule = { config: GroupSetupDefinition; };


export type InteractionReply = Replace<InteractionReplyOptions, 'embeds', AnyTuple<APIEmbed>>;


export type GroupTypes = {
    CATEGORY: `CATEGORY`,
    SHADOW: `SHADOW`,
    COMPLETE: `CATEGORY_SHADOW`
};

export type CategoryGroupDefinition = {
    type: `CATEGORY`;
    categories: Set<string>;
};
export type ShadowGroupDefinition = {
    type: `SHADOW`;
    permissions: CommandPermissions;
};
