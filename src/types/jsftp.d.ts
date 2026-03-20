declare module 'jsftp' {
  export default class JSFTP {
    constructor(options: any);
    ls(path: string, callback: (err: Error | null, res: any[]) => void): void;
    get(remotePath: string, callback: (err: Error | null, socket: any) => void): void;
    put(buffer: Buffer | string, remotePath: string, callback: (err: Error | null) => void): void;
    raw(command: string, arg: string, callback: (err: Error | null, data: any) => void): void;
    raw(command: string, callback: (err: Error | null, data: any) => void): void;
    destroy(): void;
    on(event: string, callback: (...args: any[]) => void): void;
    auth(user: string, pass: string, callback: (err: Error | null, data: any) => void): void;
  }
}
