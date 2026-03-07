import { describe, expect, test } from 'vitest';
import {
  parseHidReport,
  parseSonyControllerReport,
  parseSwitchProControllerReport,
  parseXboxControllerReport
} from './reportParser';

describe('reportParser', () => {
  test('parses switch pro controller report', () => {
    const report = Buffer.alloc(20, 0);
    report[0] = 0x30;
    report[3] = 0b00001100;
    report[4] = 0b00110000;
    report[5] = 0b00001110;

    const leftXRaw = 3072;
    const leftYRaw = 1024;
    const rightXRaw = 2500;
    const rightYRaw = 1500;

    report[6] = leftXRaw & 0xff;
    report[7] = ((leftXRaw >> 8) & 0x0f) | ((leftYRaw & 0x0f) << 4);
    report[8] = (leftYRaw >> 4) & 0xff;
    report[9] = rightXRaw & 0xff;
    report[10] = ((rightXRaw >> 8) & 0x0f) | ((rightYRaw & 0x0f) << 4);
    report[11] = (rightYRaw >> 4) & 0xff;

    const parsed = parseSwitchProControllerReport(report);
    expect(parsed).not.toBeNull();
    expect(parsed?.buttons[1]).toBe(true);
    expect(parsed?.buttons[16]).toBe(true);
    expect(parsed?.buttons[12]).toBe(true);
    expect(parsed?.axes[0]).toBeGreaterThan(0.4);
    expect(parsed?.axes[1]).toBeLessThan(-0.4);
  });

  test('parses sony controller report', () => {
    const report = Buffer.alloc(16, 0);
    report[0] = 0x01;
    report[1] = 255;
    report[2] = 127;
    report[3] = 0;
    report[4] = 200;
    report[5] = 0b00100010;
    report[6] = 0b00010001;
    report[7] = 0b00000010;

    const parsed = parseSonyControllerReport(report);
    expect(parsed).not.toBeNull();
    expect(parsed?.buttons[0]).toBe(true);
    expect(parsed?.buttons[8]).toBe(true);
    expect(parsed?.buttons[17]).toBe(true);
    expect(parsed?.buttons[15]).toBe(true);
    expect(parsed?.axes[0]).toBeGreaterThan(0.9);
    expect(parsed?.axes[2]).toBeLessThan(-0.9);
  });

  test('parses xbox controller report', () => {
    const report = Buffer.alloc(14, 0);
    report[2] = 0x11;
    report[3] = 0x15;
    report[4] = 60;
    report[5] = 120;

    report.writeInt16LE(16000, 6);
    report.writeInt16LE(-12000, 8);
    report.writeInt16LE(8000, 10);
    report.writeInt16LE(-4000, 12);

    const parsed = parseXboxControllerReport(report);
    expect(parsed).not.toBeNull();
    expect(parsed?.buttons[0]).toBe(true);
    expect(parsed?.buttons[9]).toBe(true);
    expect(parsed?.buttons[4]).toBe(true);
    expect(parsed?.buttons[6]).toBe(true);
    expect(parsed?.buttons[7]).toBe(true);
    expect(parsed?.axes[0]).toBeGreaterThan(0.45);
    expect(parsed?.axes[1]).toBeLessThan(-0.35);
  });

  test('auto parser falls back by product name', () => {
    const report = Buffer.alloc(20, 0);
    report[0] = 0x30;
    report[3] = 0b00000100;
    report[6] = 0xff;
    report[7] = 0x07;
    report[8] = 0x80;
    report[9] = 0x00;
    report[10] = 0x08;
    report[11] = 0x80;

    const parsed = parseHidReport(report, {
      vendorId: 1406,
      productId: 8201,
      product: 'Pro Controller'
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.buttons[0]).toBe(true);
  });
});
