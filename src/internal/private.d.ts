export type RegisteredTask = { callback: (...args: any) => void; id: number | NodeJS.Timeout; };
