import {
  GAMEPAD_DEVICE_PROFILES,
  type GamepadDeviceProfile,
  resolveDeviceProfile
} from './deviceProfiles';
import type { HidDeviceInfo } from './hidTypes';

export type ResolvedGamepadDevice = {
  info: HidDeviceInfo;
  profile: GamepadDeviceProfile;
};

export const resolveConnectedGamepadDevices = (
  devices: HidDeviceInfo[]
): ResolvedGamepadDevice[] => {
  return devices
    .filter((info) => Boolean(info.path))
    .map((info) => {
      const profile = resolveDeviceProfile(info, GAMEPAD_DEVICE_PROFILES);
      return profile ? { info, profile } : null;
    })
    .filter((item): item is ResolvedGamepadDevice => item !== null);
};

export const selectGamepadDevice = (
  devices: ResolvedGamepadDevice[],
  lockedPath: string | null
): ResolvedGamepadDevice | null => {
  if (devices.length === 0) {
    return null;
  }

  if (lockedPath) {
    const locked = devices.find((device) => device.info.path === lockedPath);
    if (locked) {
      return locked;
    }
  }

  const sorted = [...devices].sort((left, right) => {
    if (left.profile.priority !== right.profile.priority) {
      return right.profile.priority - left.profile.priority;
    }

    if ((left.info.vendorId ?? 0) !== (right.info.vendorId ?? 0)) {
      return (left.info.vendorId ?? 0) - (right.info.vendorId ?? 0);
    }

    if ((left.info.productId ?? 0) !== (right.info.productId ?? 0)) {
      return (left.info.productId ?? 0) - (right.info.productId ?? 0);
    }

    return (left.info.path ?? '').localeCompare(right.info.path ?? '');
  });

  return sorted[0] ?? null;
};
