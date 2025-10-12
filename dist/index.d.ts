import type { OTelRNOptions } from './types';
export declare class MTNOTel {
    private static _instance;
    private shutdownFns;
    static init(opts: OTelRNOptions): MTNOTel;
    flushAndShutdown(): Promise<void>;
}
export * from './types';
export * from './context';
export * from './business';
