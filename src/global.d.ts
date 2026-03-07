declare global {
  interface Window {
    electronAPI: {
      onNativeGamepadState: (
        listener: import('./gamepad/types').NativeGamepadListener
      ) => () => void;
    };
  }
}

export {};
