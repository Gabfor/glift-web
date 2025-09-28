"use client";

const isDebugEnabled = () =>
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG === "1";

export type ScopedLogger = {
  scope: string;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
};

function emit(level: "info" | "warn" | "error" | "debug", scope: string, args: any[]) {
  const prefix = `[${scope}]`;

  if (level === "debug" && !isDebugEnabled()) {
    return;
  }

  const method =
    level === "warn"
      ? console.warn
      : level === "error"
      ? console.error
      : level === "debug"
      ? console.debug
      : console.log;

  method(prefix, ...args);
}

export function createScopedLogger(scope: string): ScopedLogger {
  return {
    scope,
    info: (...args: any[]) => emit("info", scope, args),
    warn: (...args: any[]) => emit("warn", scope, args),
    error: (...args: any[]) => emit("error", scope, args),
    debug: (...args: any[]) => emit("debug", scope, args),
  };
}
