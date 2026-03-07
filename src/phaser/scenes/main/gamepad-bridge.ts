import { createEmptyButtonStates } from '../../../gamepad/buttonState';
import type { NativeGamepadState } from '../../../gamepad/types';

type SubscribeNativeGamepadParams = {
  getCurrentState: () => NativeGamepadState | null;
  setCurrentState: (state: NativeGamepadState) => void;
  setPreviousButtons: (buttons: boolean[]) => void;
};

export const subscribeNativeGamepadState = ({
  getCurrentState,
  setCurrentState,
  setPreviousButtons
}: SubscribeNativeGamepadParams): (() => void) | null => {
  if (!window.electronAPI) {
    return null;
  }

  return window.electronAPI.onNativeGamepadState(
    (state: NativeGamepadState) => {
      const currentState = getCurrentState();
      const previousButtons = currentState?.buttons
        ? [...currentState.buttons]
        : createEmptyButtonStates();

      setPreviousButtons(previousButtons);
      setCurrentState(state);
    }
  );
};
