import fs from 'node:fs';
import path from 'node:path';
import { isDebugLogTarget, type NativeGamepadDebugConfig } from './debugConfig';
import type { HidDeviceInfo } from './hidTypes';
import type { ParsedReport } from './reportParser';

export class NativeGamepadDebugLogger {
  private readonly logFilePath: string | null;
  private currentDeviceInfo: HidDeviceInfo | null = null;
  private lastRawReportLogAt = 0;

  constructor(
    private readonly config: NativeGamepadDebugConfig,
    logDirectoryPath?: string
  ) {
    this.logFilePath =
      this.config.enabled &&
      this.config.outputModes.has('file') &&
      logDirectoryPath
        ? path.join(logDirectoryPath, 'native-gamepad.log')
        : null;

    if (this.logFilePath) {
      fs.mkdirSync(path.dirname(this.logFilePath), { recursive: true });
    }
  }

  setCurrentDevice(deviceInfo: HidDeviceInfo | null): void {
    this.currentDeviceInfo = deviceInfo;
  }

  info(message: string): void {
    if (!this.shouldLog()) {
      return;
    }

    const line = `[native-gamepad][debug] ${new Date().toISOString()} ${message}`;

    if (this.config.outputModes.has('console')) {
      console.info(line);
    }

    if (this.config.outputModes.has('file')) {
      this.writeLogFile(line);
    }
  }

  rawReport(data: Buffer): void {
    if (!this.shouldLog()) {
      return;
    }

    const now = Date.now();
    if (now - this.lastRawReportLogAt < this.config.rawReportLogIntervalMs) {
      return;
    }

    this.lastRawReportLogAt = now;
    const previewLength = Math.min(data.length, 32);
    const hex = data
      .subarray(0, previewLength)
      .toString('hex')
      .match(/.{1,2}/g)
      ?.join(' ');

    this.info(
      `raw report len=${data.length} preview(${previewLength}B)=${hex ?? ''}`
    );
  }

  parsedReport(report: ParsedReport): void {
    if (!this.shouldLog()) {
      return;
    }

    const pressedButtons = report.buttons
      .map((pressed, index) => (pressed ? index : -1))
      .filter((index) => index >= 0)
      .join(',');
    const [lx, ly, rx, ry] = report.axes;

    this.info(
      `parsed axes=[${lx.toFixed(3)}, ${ly.toFixed(3)}, ${rx.toFixed(3)}, ${ry.toFixed(
        3
      )}] pressed=[${pressedButtons}]`
    );
  }

  private shouldLog(): boolean {
    return (
      this.config.enabled &&
      isDebugLogTarget(this.currentDeviceInfo, this.config)
    );
  }

  private writeLogFile(line: string): void {
    if (!this.logFilePath) {
      return;
    }

    try {
      this.rotateLogIfNeeded();
      fs.appendFileSync(this.logFilePath, `${line}\n`, 'utf8');
    } catch {
      // noop
    }
  }

  private rotateLogIfNeeded(): void {
    if (!this.logFilePath || !fs.existsSync(this.logFilePath)) {
      return;
    }

    const stat = fs.statSync(this.logFilePath);
    if (stat.size < this.config.logRotateMaxSizeBytes) {
      return;
    }

    for (let index = this.config.logRotateKeepFiles; index >= 1; index--) {
      const from = `${this.logFilePath}.${index}`;
      const to = `${this.logFilePath}.${index + 1}`;
      if (fs.existsSync(from)) {
        fs.renameSync(from, to);
      }
    }

    fs.renameSync(this.logFilePath, `${this.logFilePath}.1`);
  }
}
