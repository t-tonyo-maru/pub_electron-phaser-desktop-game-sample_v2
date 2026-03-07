export const INPUT_SETTINGS_STORAGE_KEY = 'nativeGamepadInputSettings';

export type GamepadInputSettings = {
  leftDeadzone: number;
  rightDeadzone: number;
  leftSensitivity: number;
  rightSensitivity: number;
  invertLeftYAxis: boolean;
  invertRightYAxis: boolean;
};

export const DEFAULT_INPUT_SETTINGS: GamepadInputSettings = {
  leftDeadzone: 0.18,
  rightDeadzone: 0.18,
  leftSensitivity: 1,
  rightSensitivity: 1,
  invertLeftYAxis: false,
  invertRightYAxis: false
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const normalizeAxisWithSettings = (
  value: number,
  deadzone: number,
  sensitivity: number,
  invert: boolean
): number => {
  const signed = invert ? -value : value;
  const abs = Math.abs(signed);
  if (abs < deadzone) {
    return 0;
  }

  const normalized = (abs - deadzone) / (1 - deadzone);
  const curved = normalized ** (1 / Math.max(0.01, sensitivity));
  return clamp(Math.sign(signed) * curved, -1, 1);
};

export const applyInputSettings = (
  axes: [number, number, number, number],
  settings: GamepadInputSettings
): [number, number, number, number] => {
  return [
    normalizeAxisWithSettings(
      axes[0],
      settings.leftDeadzone,
      settings.leftSensitivity,
      false
    ),
    normalizeAxisWithSettings(
      axes[1],
      settings.leftDeadzone,
      settings.leftSensitivity,
      settings.invertLeftYAxis
    ),
    normalizeAxisWithSettings(
      axes[2],
      settings.rightDeadzone,
      settings.rightSensitivity,
      false
    ),
    normalizeAxisWithSettings(
      axes[3],
      settings.rightDeadzone,
      settings.rightSensitivity,
      settings.invertRightYAxis
    )
  ];
};

export const loadInputSettingsFromStorage = (): GamepadInputSettings => {
  try {
    const raw = window.localStorage.getItem(INPUT_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_INPUT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<GamepadInputSettings>;
    return {
      leftDeadzone: clamp(
        parsed.leftDeadzone ?? DEFAULT_INPUT_SETTINGS.leftDeadzone,
        0,
        0.95
      ),
      rightDeadzone: clamp(
        parsed.rightDeadzone ?? DEFAULT_INPUT_SETTINGS.rightDeadzone,
        0,
        0.95
      ),
      leftSensitivity: clamp(
        parsed.leftSensitivity ?? DEFAULT_INPUT_SETTINGS.leftSensitivity,
        0.25,
        2
      ),
      rightSensitivity: clamp(
        parsed.rightSensitivity ?? DEFAULT_INPUT_SETTINGS.rightSensitivity,
        0.25,
        2
      ),
      invertLeftYAxis:
        parsed.invertLeftYAxis ?? DEFAULT_INPUT_SETTINGS.invertLeftYAxis,
      invertRightYAxis:
        parsed.invertRightYAxis ?? DEFAULT_INPUT_SETTINGS.invertRightYAxis
    };
  } catch {
    return DEFAULT_INPUT_SETTINGS;
  }
};
