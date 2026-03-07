import type { DeviceIdentity, GamepadParserKind } from './deviceProfiles';

export const NINTENDO_VENDOR_ID = 0x057e;
export const SWITCH_PRO_CONTROLLER_PRODUCT_ID = 0x2009;
export const SONY_VENDOR_ID = 0x054c;
export const MICROSOFT_VENDOR_ID = 0x045e;

export type ParsedReport = {
  buttons: boolean[];
  axes: [number, number, number, number];
};

const BUTTON_COUNT = 22;

const createButtonSnapshot = (): boolean[] => {
  return Array.from({ length: BUTTON_COUNT }, () => false);
};

const normalizeSwitchAxis = (raw: number): number => {
  const centered = (raw - 2048) / 2048;
  return Math.max(-1, Math.min(1, centered));
};

const normalizeUnsignedAxis = (raw: number): number => {
  const centered = (raw - 127.5) / 127.5;
  return Math.max(-1, Math.min(1, centered));
};

const normalizeSignedAxis = (raw: number): number => {
  const centered = raw < 0 ? raw / 32768 : raw / 32767;
  return Math.max(-1, Math.min(1, centered));
};

const applyHatButtons = (buttons: boolean[], hat: number): void => {
  buttons[12] = hat === 0 || hat === 1 || hat === 7;
  buttons[13] = hat === 3 || hat === 4 || hat === 5;
  buttons[14] = hat === 5 || hat === 6 || hat === 7;
  buttons[15] = hat === 1 || hat === 2 || hat === 3;
};

export const parseSwitchProControllerReport = (
  data: Buffer
): ParsedReport | null => {
  const reportId = data[0];
  const baseOffset = reportId === 0x30 ? 0 : data[1] === 0x30 ? 1 : -1;

  if (baseOffset < 0) {
    return null;
  }

  const buttonOffset = baseOffset + 3;
  const stickOffset = baseOffset + 6;
  if (data.length <= stickOffset + 5) {
    return null;
  }

  const b3 = data[buttonOffset];
  const b4 = data[buttonOffset + 1];
  const b5 = data[buttonOffset + 2];
  const buttons = createButtonSnapshot();

  buttons[0] = (b3 & 0b00000100) !== 0;
  buttons[1] = (b3 & 0b00001000) !== 0;
  buttons[2] = (b3 & 0b00000001) !== 0;
  buttons[3] = (b3 & 0b00000010) !== 0;
  buttons[4] = (b5 & 0b01000000) !== 0;
  buttons[5] = (b3 & 0b01000000) !== 0;
  buttons[6] = (b5 & 0b10000000) !== 0;
  buttons[7] = (b3 & 0b10000000) !== 0;
  buttons[8] = (b4 & 0b00000001) !== 0;
  buttons[9] = (b4 & 0b00000010) !== 0;
  buttons[10] = (b4 & 0b00001000) !== 0;
  buttons[11] = (b4 & 0b00000100) !== 0;
  buttons[12] = (b5 & 0b00000010) !== 0;
  buttons[13] = (b5 & 0b00000001) !== 0;
  buttons[14] = (b5 & 0b00001000) !== 0;
  buttons[15] = (b5 & 0b00000100) !== 0;
  buttons[16] = (b4 & 0b00010000) !== 0;
  buttons[17] = (b4 & 0b00100000) !== 0;

  const leftX = data[stickOffset] | ((data[stickOffset + 1] & 0x0f) << 8);
  const leftY = (data[stickOffset + 1] >> 4) | (data[stickOffset + 2] << 4);
  const rightX = data[stickOffset + 3] | ((data[stickOffset + 4] & 0x0f) << 8);
  const rightY = (data[stickOffset + 4] >> 4) | (data[stickOffset + 5] << 4);

  return {
    buttons,
    axes: [
      normalizeSwitchAxis(leftX),
      normalizeSwitchAxis(leftY),
      normalizeSwitchAxis(rightX),
      normalizeSwitchAxis(rightY)
    ]
  };
};

export const parseSonyControllerReport = (
  data: Buffer
): ParsedReport | null => {
  const axisOffset = data[0] === 0x01 ? 1 : 0;
  if (data.length < axisOffset + 11) {
    return null;
  }

  const leftX = normalizeUnsignedAxis(data[axisOffset]);
  const leftY = normalizeUnsignedAxis(data[axisOffset + 1]);
  const rightX = normalizeUnsignedAxis(data[axisOffset + 2]);
  const rightY = normalizeUnsignedAxis(data[axisOffset + 3]);

  const buttonOffsetCandidates = [axisOffset + 4, axisOffset + 7];
  let buttonOffset = -1;
  for (const candidate of buttonOffsetCandidates) {
    if (data.length > candidate + 2 && (data[candidate] & 0x0f) <= 8) {
      buttonOffset = candidate;
      break;
    }
  }

  if (buttonOffset < 0) {
    return null;
  }

  const b0 = data[buttonOffset];
  const b1 = data[buttonOffset + 1];
  const b2 = data[buttonOffset + 2];
  const buttons = createButtonSnapshot();

  applyHatButtons(buttons, b0 & 0x0f);

  buttons[0] = (b0 & 0b00100000) !== 0;
  buttons[1] = (b0 & 0b01000000) !== 0;
  buttons[2] = (b0 & 0b00010000) !== 0;
  buttons[3] = (b0 & 0b10000000) !== 0;
  buttons[4] = (b1 & 0b00000001) !== 0;
  buttons[5] = (b1 & 0b00000010) !== 0;
  buttons[6] = (b1 & 0b00000100) !== 0;
  buttons[7] = (b1 & 0b00001000) !== 0;
  buttons[8] = (b1 & 0b00010000) !== 0;
  buttons[9] = (b1 & 0b00100000) !== 0;
  buttons[10] = (b1 & 0b01000000) !== 0;
  buttons[11] = (b1 & 0b10000000) !== 0;
  buttons[16] = (b2 & 0b00000001) !== 0;
  buttons[17] = (b2 & 0b00000010) !== 0;

  return { buttons, axes: [leftX, leftY, rightX, rightY] };
};

export const parseXboxControllerReport = (
  data: Buffer
): ParsedReport | null => {
  if (data.length < 13) {
    return null;
  }

  const offsets =
    data.length >= 14
      ? { button: 2, trigger: 4, axis: 6 }
      : { button: 1, trigger: 3, axis: 5 };

  if (data.length <= offsets.axis + 7) {
    return null;
  }

  const buttonWord = data[offsets.button] | (data[offsets.button + 1] << 8);
  const triggerLeft = data[offsets.trigger] ?? 0;
  const triggerRight = data[offsets.trigger + 1] ?? 0;
  const buttons = createButtonSnapshot();

  buttons[0] = (buttonWord & 0x1000) !== 0;
  buttons[1] = (buttonWord & 0x2000) !== 0;
  buttons[2] = (buttonWord & 0x4000) !== 0;
  buttons[3] = (buttonWord & 0x8000) !== 0;
  buttons[4] = (buttonWord & 0x0100) !== 0;
  buttons[5] = (buttonWord & 0x0200) !== 0;
  buttons[6] = triggerLeft > 30;
  buttons[7] = triggerRight > 30;
  buttons[8] = (buttonWord & 0x0020) !== 0;
  buttons[9] = (buttonWord & 0x0010) !== 0;
  buttons[10] = (buttonWord & 0x0040) !== 0;
  buttons[11] = (buttonWord & 0x0080) !== 0;
  buttons[12] = (buttonWord & 0x0001) !== 0;
  buttons[13] = (buttonWord & 0x0002) !== 0;
  buttons[14] = (buttonWord & 0x0004) !== 0;
  buttons[15] = (buttonWord & 0x0008) !== 0;
  buttons[16] = (buttonWord & 0x0400) !== 0;

  const leftX = normalizeSignedAxis(data.readInt16LE(offsets.axis));
  const leftY = normalizeSignedAxis(data.readInt16LE(offsets.axis + 2));
  const rightX = normalizeSignedAxis(data.readInt16LE(offsets.axis + 4));
  const rightY = normalizeSignedAxis(data.readInt16LE(offsets.axis + 6));

  return { buttons, axes: [leftX, leftY, rightX, rightY] };
};

const resolveParserKind = (
  deviceIdentity?: DeviceIdentity,
  preferredParser?: GamepadParserKind
): GamepadParserKind => {
  if (preferredParser && preferredParser !== 'auto') {
    return preferredParser;
  }

  const vendorId = deviceIdentity?.vendorId;
  const productName = deviceIdentity?.product?.toLowerCase() ?? '';

  if (
    vendorId === NINTENDO_VENDOR_ID ||
    productName.includes('pro controller') ||
    productName.includes('joy-con')
  ) {
    return 'switch';
  }

  if (
    vendorId === SONY_VENDOR_ID ||
    productName.includes('dualshock') ||
    productName.includes('dualsense') ||
    productName.includes('wireless controller')
  ) {
    return 'sony';
  }

  if (
    vendorId === MICROSOFT_VENDOR_ID ||
    productName.includes('xbox') ||
    productName.includes('xinput')
  ) {
    return 'xbox';
  }

  return 'auto';
};

export const parseHidReport = (
  data: Buffer,
  deviceIdentity?: DeviceIdentity,
  preferredParser?: GamepadParserKind
): ParsedReport | null => {
  const parserKind = resolveParserKind(deviceIdentity, preferredParser);

  if (parserKind === 'switch') {
    return parseSwitchProControllerReport(data);
  }

  if (parserKind === 'sony') {
    return parseSonyControllerReport(data);
  }

  if (parserKind === 'xbox') {
    return parseXboxControllerReport(data);
  }

  return (
    parseSwitchProControllerReport(data) ??
    parseSonyControllerReport(data) ??
    parseXboxControllerReport(data)
  );
};
