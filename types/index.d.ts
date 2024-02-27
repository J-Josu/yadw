declare module 'yadw' {
	import type { APIEmbed, ChatInputCommandInteraction, InteractionReplyOptions, LocaleString, PermissionFlags, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandsOnlyBuilder, Client as Client_1, ClientEvents, Collection } from 'discord.js';
	type MemberType = {
		Owner: 'Owner',
		Admin: 'Administrator',
		Mod: 'Moderator',
		Normal: 'Normal',
		Visitor: 'Visitor',
	};

	type MemberTypeValues = Values<MemberType>;

	type Locals = {
		MemberType: MemberTypeValues;
	};

	type CommandCallbackArgs = {
		client: Client;
		interaction: ChatInputCommandInteraction<'cached'>;
		locals: Locals;
	};


	type SlashCommandBuilderReturns = SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder;


	export type SlashCommandTrait = {
		readonly data: SlashCommandBuilderReturns,
		execute(arg: CommandCallbackArgs): Promise<unknown>;
	};


	type CommandPermissions = Values<PermissionFlags>[];


	export type SingleFileCommandDefinition<P extends readonly unknown[] = unknown[]> = (...args: P) => {
		readonly data: SlashCommandBuilderReturns;
		readonly permissions?: CommandPermissions;
		execute(arg: CommandCallbackArgs): Promise<unknown>;
	};


	export type MultiFileCommandDefinition<P extends readonly unknown[] = unknown[]> = (...args: P) => {
		readonly data: SlashCommandBuilder;
		readonly permissions?: CommandPermissions;
		execute?(arg: CommandCallbackArgs): Promise<unknown>;
		readonly subCommandsArgs?: AnyTuple;
	};


	export type SubCommandGroupDefinition = () => {
		readonly data: SlashCommandSubcommandGroupBuilder;
	};


	export type BaseSubCommandDefinition<P extends readonly unknown[] = unknown[]> = (...args: P) => {
		readonly data: SlashCommandSubcommandBuilder;
		execute(arg: CommandCallbackArgs): Promise<unknown>;
	};

	export type SubCommandDefinitionFrom<T extends MultiFileCommandDefinition, A = ReturnType<T>['subCommandsArgs']> = BaseSubCommandDefinition<A extends AnyTuple ? A : []>;


	export type GroupSetupDefinition = {
		readonly permissions?: CommandPermissions;
		readonly categories?: Set<string>;
		readonly description?: Partial<Record<LocaleString, string>> & { "en-US": string; };
	};


	export type InteractionReply = Replace<InteractionReplyOptions, 'embeds', AnyTuple<APIEmbed>>;
	type EventNames = keyof ClientEvents;

	type EventCallback<N extends EventNames, C extends Client_1 = ExtendedClient> = (client: C, ...args: ClientEvents[N]) => void;

	type EventTrait<N extends EventNames> = {
		readonly once: boolean;
		readonly name: N;
		readonly description: string;
		readonly response: EventCallback<N>;
	};

	export type EventDefinition<N extends EventNames, A extends unknown[] = []> = (...args: A) => EventTrait<N>;
	type Values<T> = T[keyof T];

	type Replace<T extends object, K extends keyof T, V> = Omit<T, K> & Record<K, V>;

	type AnyTuple<T = unknown> = [] | [T, ...T[]];
	class Client extends Client_1<boolean> {
		constructor();
		
		commands: Collection<string, SlashCommandTrait>;
		
		programedTasks: Map<string, RegisteredTask>;
		
		scheduledTasks: Map<string, RegisteredTask>;
		selectMenus: Collection<any, any>;
		start(): Promise<void>;
		
		programTask<C extends (...args: A) => void, A extends unknown[]>({ name, callback, ms, args, initialize }: ProgramTaskData<C, A>): void;
		
		removeProgramedTask(name: string): void;
		
		scheduleTask<C_1 extends (...args: A_1) => void, A_1 extends unknown[]>({ name, callback, interval, args, initialize }: ScheduleTaskData<C_1, A_1>): void;
		
		removeScheduledTask(name: string): void;
	}
	type RegisteredTask = { callback: (...args: any) => void; id: number | NodeJS.Timeout; };

	type TaskData<C extends (...args: A) => void, A extends unknown[]> = {
		name: string,
		callback: C,
		args: A;
		initialize?: boolean;
	};

	type ProgramTaskData<C extends (...args: A) => void, A extends unknown[]> = TaskData<C, A> & { ms: number; };

	type ScheduleTaskData<C extends (...args: A) => void, A extends unknown[]> = TaskData<C, A> & { interval: number; };
}

//# sourceMappingURL=index.d.ts.map