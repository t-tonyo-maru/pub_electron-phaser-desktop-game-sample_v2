// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import {
  NATIVE_GAMEPAD_STATE_CHANNEL,
  type NativeGamepadListener,
  type NativeGamepadState
} from './gamepad/types';

contextBridge.exposeInMainWorld('electronAPI', {
  onNativeGamepadState: (listener: NativeGamepadListener) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      state: NativeGamepadState
    ) => {
      listener(state);
    };

    ipcRenderer.on(NATIVE_GAMEPAD_STATE_CHANNEL, handler);

    return () => {
      ipcRenderer.removeListener(NATIVE_GAMEPAD_STATE_CHANNEL, handler);
    };
  }
});
