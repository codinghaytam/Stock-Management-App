import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: unknown;
  error?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class Logger {
  private readonly endpoint = '/logs';
  private readonly isBrowser: boolean;

  private queue: LogEntry[] = [];
  private sending = false;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  info(message: string, context?: unknown) {
    this.enqueue('info', message, context);
  }

  warn(message: string, context?: unknown) {
    this.enqueue('warn', message, context);
  }

  error(message: string, context?: unknown, err?: unknown) {
    const normalized = err instanceof Error ? `${err.name}: ${err.message}` : this.stringify(err);
    this.enqueue('error', message, context, normalized);
  }

  private enqueue(level: LogLevel, message: string, context?: unknown, error?: string) {
    const entry: LogEntry = {
      level,
      message,
      context,
      error,
      timestamp: new Date().toISOString(),
    };

    if (!this.isBrowser) {
      this.forwardToConsole(entry);
      return;
    }

    this.queue.push(entry);
    this.flushQueue();
  }

  private flushQueue() {
    if (this.sending || this.queue.length === 0 || !this.isBrowser) {
      return;
    }

    this.sending = true;
    const next = this.queue.shift()!;

    this.http
      .post(this.endpoint, next)
      .pipe(
        catchError((err) => {
          this.forwardToConsole(next, err);
          return of(null);
        }),
        finalize(() => {
          this.sending = false;
          this.flushQueue();
        }),
      )
      .subscribe();
  }

  private forwardToConsole(entry: LogEntry, err?: unknown) {
    const payload = { context: entry.context, error: entry.error, transportError: err };
    if (entry.level === 'error') {
      console.error(`[Logger] ${entry.message}`, payload);
      return;
    }
    if (entry.level === 'warn') {
      console.warn(`[Logger] ${entry.message}`, payload);
      return;
    }
    console.info(`[Logger] ${entry.message}`, payload);
  }

  private stringify(value: unknown): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
