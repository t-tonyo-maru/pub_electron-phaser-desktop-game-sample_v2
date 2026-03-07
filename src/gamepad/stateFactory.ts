import type { HidDeviceInfo } from './hidTypes';
import type { ParsedReport } from './reportParser';
import type {
  NativeGamepadConnectionState,
  NativeGamepadState,
  NativeSelectedGamepad
} from './types';

export const createButtonSnapshot = (): boolean[] => {
  return Array.from({ length: 22 }, () => false);
};

export const createSelectedDevice = (
  deviceInfo: HidDeviceInfo | null
): NativeSelectedGamepad | null => {
  if (!deviceInfo) {
    return null;
  }

  return {
    vendorId: deviceInfo.vendorId ?? null,
    productId: deviceInfo.productId ?? null,
    product: deviceInfo.product ?? null,
    devicePath: deviceInfo.path ?? null
  };
};

export const createIdleState = (input: {
  connectionState: NativeGamepadConnectionState;
  reconnectAttempt: number;
  connectedDeviceCount: number;
  selectedDeviceInfo?: HidDeviceInfo | null;
}): NativeGamepadState => {
  const selected = createSelectedDevice(input.selectedDeviceInfo ?? null);

  return {
    connected: input.connectionState === 'connected',
    connectionState: input.connectionState,
    reconnectAttempt: input.reconnectAttempt,
    connectedDeviceCount: input.connectedDeviceCount,
    selectedDevice: selected,
    product: selected?.product ?? null,
    devicePath: selected?.devicePath ?? null,
    buttons: createButtonSnapshot(),
    axes: [0, 0, 0, 0],
    timestamp: Date.now()
  };
};

export const createConnectedState = (input: {
  report: ParsedReport;
  reconnectAttempt: number;
  connectedDeviceCount: number;
  selectedDeviceInfo: HidDeviceInfo | null;
}): NativeGamepadState => {
  const selected = createSelectedDevice(input.selectedDeviceInfo);

  return {
    connected: true,
    connectionState: 'connected',
    reconnectAttempt: input.reconnectAttempt,
    connectedDeviceCount: input.connectedDeviceCount,
    selectedDevice: selected,
    product: selected?.product ?? null,
    devicePath: selected?.devicePath ?? null,
    buttons: input.report.buttons,
    axes: input.report.axes,
    timestamp: Date.now()
  };
};
