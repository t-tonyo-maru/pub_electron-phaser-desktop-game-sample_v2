import profilesJson from './device-profiles.json';

export type GamepadParserKind = 'switch' | 'sony' | 'xbox' | 'auto';

export type GamepadDeviceProfile = {
  name: string;
  vendorId?: number;
  productId?: number;
  matchName?: string;
  parser: GamepadParserKind;
  priority: number;
};

export type DeviceIdentity = {
  vendorId?: number;
  productId?: number;
  product?: string | null;
};

export const GAMEPAD_DEVICE_PROFILES = profilesJson as GamepadDeviceProfile[];

export const resolveDeviceProfile = (
  identity: DeviceIdentity,
  profiles: GamepadDeviceProfile[] = GAMEPAD_DEVICE_PROFILES
): GamepadDeviceProfile | null => {
  const productName = identity.product?.toLowerCase() ?? '';
  const sortedProfiles = [...profiles].sort((a, b) => b.priority - a.priority);

  for (const profile of sortedProfiles) {
    if (
      typeof profile.vendorId === 'number' &&
      profile.vendorId !== identity.vendorId
    ) {
      continue;
    }

    if (
      typeof profile.productId === 'number' &&
      profile.productId !== identity.productId
    ) {
      continue;
    }

    if (profile.matchName) {
      const re = new RegExp(profile.matchName, 'i');
      if (!re.test(productName)) {
        continue;
      }
    }

    return profile;
  }

  return null;
};
