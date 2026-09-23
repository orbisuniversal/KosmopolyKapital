export interface LogEntry {
  step: number | string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  timestamp: string;
}

export class AnalysisLogger {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  constructor() {
    this.logs = [];
  }

  public log(step: number | string, level: 'info' | 'warn' | 'error' | 'success', message: string) {
    const entry: LogEntry = {
      step,
      level,
      message,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(entry);
    this.notifyListeners();
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear() {
    this.logs = [];
    this.notifyListeners();
  }

  public subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.getLogs()));
  }
}

export const globalAnalysisLogger = new AnalysisLogger();
