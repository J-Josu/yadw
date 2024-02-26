declare module 'yadwjs' {
	export type LogFunction = (...args: any[]) => void;

	export type Logger = {
		/**
		 * Logs only in development mode
		 */
		dev: LogFunction,
		/**
		 * Logs in development mode or when log level is 4 or higher
		 */
		debug: LogFunction,
		/**
		 * Logs in development mode or when log level is 3 or higher
		 */
		info: LogFunction,
		/**
		 * Logs when log level is 2 or higher
		 */
		warn: LogFunction,
		/**
		 * Logs when log level is 1 or higher
		 */
		error: LogFunction,
		/**
		 * Logs always
		 */
		fatal: LogFunction,
		/**
		 * Logs always
		 */
		core: LogFunction,
	};
	export function createLogger(level: number, dev: boolean): Logger;

	export function numberFromEnv(env: string | undefined, defaultValue: number): number;
}

//# sourceMappingURL=index.d.ts.map