import type { HidDeviceInfo } from './hidTypes';

export type DeviceIdFilter = {
  allow: Set<number> | null;
  deny: Set<number> | null;
};

export type DebugOutputMode = 'console' | 'file';

export type NativeGamepadDebugConfig = {
  enabled: boolean;
  vendorIdFilter: DeviceIdFilter;
  productIdFilter: DeviceIdFilter;
  outputModes: Set<DebugOutputMode>;
  rawReportLogIntervalMs: number;
  logRotateMaxSizeBytes: number;
  logRotateKeepFiles: number;
};

export const parseDeviceIdFilter = (value?: string): DeviceIdFilter => {
  if (!value) {
    return { allow: null, deny: null };
  }

  const allowValues = new Set<number>();
  const denyValues = new Set<number>();

  for (const token of value.split(',')) {
    const trimmed = token.trim().toLowerCase();
    if (!trimmed) {
      continue;
    }

    const deny = trimmed.startsWith('!');
    const normalized = deny ? trimmed.slice(1) : trimmed;
    const parsed = Number.parseInt(
      normalized,
      normalized.startsWith('0x') ? 16 : 10
    );

    if (Number.isNaN(parsed)) {
      continue;
    }

    if (deny) {
      denyValues.add(parsed);
      continue;
    }

    allowValues.add(parsed);
  }

  return {
    allow: allowValues.size > 0 ? allowValues : null,
    deny: denyValues.size > 0 ? denyValues : null
  };
};

export const parseDebugOutputModes = (value?: string): Set<DebugOutputMode> => {
  const parsed = new Set<DebugOutputMode>();
  const tokens =
    value?.split(',').map((token) => token.trim().toLowerCase()) ?? [];

  for (const token of tokens) {
    if (token === 'console' || token === 'file') {
      parsed.add(token);
    }
  }

  if (parsed.size === 0) {
    parsed.add('console');
  }

  return parsed;
};

const matchesFilter = (
  value: number | undefined,
  filter: DeviceIdFilter
): boolean => {
  if (typeof value !== 'number') {
    return filter.allow === null;
  }

  if (filter.allow !== null && !filter.allow.has(value)) {
    return false;
  }

  if (filter.deny?.has(value)) {
    return false;
  }

  return true;
};

export const isDebugLogTarget = (
  deviceInfo: HidDeviceInfo | null,
  config: NativeGamepadDebugConfig
): boolean => {
  if (!deviceInfo) {
    return (
      config.vendorIdFilter.allow === null &&
      config.vendorIdFilter.deny === null &&
      config.productIdFilter.allow === null &&
      config.productIdFilter.deny === null
    );
  }

  return (
    matchesFilter(deviceInfo.vendorId, config.vendorIdFilter) &&
    matchesFilter(deviceInfo.productId, config.productIdFilter)
  );
};

export const createDebugConfigFromEnv = (
  env: NodeJS.ProcessEnv
): NativeGamepadDebugConfig => {
  const enabled =
    env.NATIVE_GAMEPAD_DEBUG === '1' ||
    env.NATIVE_GAMEPAD_DEBUG?.toLowerCase() === 'true';

  return {
    enabled,
    vendorIdFilter: parseDeviceIdFilter(env.NATIVE_GAMEPAD_DEBUG_VENDOR_ID),
    productIdFilter: parseDeviceIdFilter(env.NATIVE_GAMEPAD_DEBUG_PRODUCT_ID),
    outputModes: parseDebugOutputModes(env.NATIVE_GAMEPAD_DEBUG_OUTPUT),
    rawReportLogIntervalMs: 150,
    logRotateMaxSizeBytes: 1024 * 1024,
    logRotateKeepFiles: 3
  };
};
