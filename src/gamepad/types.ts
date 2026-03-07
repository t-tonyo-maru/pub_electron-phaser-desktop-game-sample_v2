export const NATIVE_GAMEPAD_STATE_CHANNEL = 'native-gamepad:state';

export type NativeGamepadConnectionState =
  | 'disconnected'
  | 'reconnecting'
  | 'connected';

export type NativeSelectedGamepad = {
  vendorId: number | null;
  productId: number | null;
  product: string | null;
  devicePath: string | null;
};

export type NativeGamepadState = {
  connected: boolean;
  connectionState: NativeGamepadConnectionState;
  reconnectAttempt: number;
  connectedDeviceCount: number;
  selectedDevice: NativeSelectedGamepad | null;
  product: string | null;
  devicePath: string | null;
  buttons: boolean[];
  axes: [number, number, number, number];
  timestamp: number;
};

export type NativeGamepadListener = (state: NativeGamepadState) => void;
