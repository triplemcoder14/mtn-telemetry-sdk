import { SpanKind } from '@opentelemetry/api';
export declare function startActiveSpan<T>(name: string, fn: (span: any) => Promise<T> | T, kind?: SpanKind): Promise<T>;
export declare function withParent<T>(parentContext: import("@opentelemetry/api").Context | undefined, fn: () => T): T;
