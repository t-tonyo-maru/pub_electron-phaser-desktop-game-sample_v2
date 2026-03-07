export const DEFAULT_GAMEPAD_BUTTON_COUNT = 22;

export const createEmptyButtonStates = (
  count = DEFAULT_GAMEPAD_BUTTON_COUNT
): boolean[] => Array.from({ length: count }, () => false);

export const hasAnyButtonPressed = (buttons: boolean[]): boolean =>
  buttons.some((pressed) => pressed);

export const isButtonJustPressed = (
  buttonIndex: number,
  previousButtons: boolean[],
  currentButtons: boolean[]
): boolean => {
  const previous = previousButtons[buttonIndex] ?? false;
  const current = currentButtons[buttonIndex] ?? false;
  return !previous && current;
};

export const hasAnyButtonJustPressed = (
  previousButtons: boolean[],
  currentButtons: boolean[]
): boolean => {
  const maxLength = Math.max(previousButtons.length, currentButtons.length);
  for (let index = 0; index < maxLength; index += 1) {
    if (isButtonJustPressed(index, previousButtons, currentButtons)) {
      return true;
    }
  }

  return false;
};
