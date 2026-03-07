import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import type nodeHid from 'node-hid';
import {
  createDebugConfigFromEnv,
  type NativeGamepadDebugConfig
} from './gamepad/debugConfig';
import { NativeGamepadDebugLogger } from './gamepad/debugLogger';
import {
  type ResolvedGamepadDevice,
  resolveConnectedGamepadDevices,
  selectGamepadDevice
} from './gamepad/deviceSelector';
import type { HidDeviceInfo } from './gamepad/hidTypes';
import { type ParsedReport, parseHidReport } from './gamepad/reportParser';
import { createConnectedState, createIdleState } from './gamepad/stateFactory';
import {
  NATIVE_GAMEPAD_STATE_CHANNEL,
  type NativeGamepadState
} from './gamepad/types';

const RECONNECT_INTERVAL_MS = 1500;
type NodeHidModule = typeof import('node-hid');

const loadNodeHid = async (): Promise<NodeHidModule | null> => {
  try {
    return (await import('node-hid')).default as NodeHidModule;
  } catch {
    return null;
  }
};

class NativeHidGamepadBridge {
  private mainWindow: BrowserWindow | null = null;
  private nodeHid: NodeHidModule | null;
  private hidDevice: nodeHid.HID | null = null;
  private hidDevicePath: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private activeDeviceInfo: HidDeviceInfo | null = null;
  private activeDevice: ResolvedGamepadDevice | null = null;
  private reconnectAttempt = 0;

  constructor(private readonly debugLogger: NativeGamepadDebugLogger) {
    this.nodeHid = null;
  }

  async start(mainWindow: BrowserWindow): Promise<void> {
    this.mainWindow = mainWindow;
    this.nodeHid = await loadNodeHid();

    if (!this.nodeHid) {
      this.debugLogger.info(
        'node-hid is unavailable; native gamepad bridge disabled'
      );
      this.emitState(
        createIdleState({
          connectionState: 'disconnected',
          reconnectAttempt: 0,
          connectedDeviceCount: 0
        })
      );
      return;
    }

    this.connectIfNeeded();
    this.reconnectTimer = setInterval(() => {
      this.connectIfNeeded();
    }, RECONNECT_INTERVAL_MS);
  }

  stop(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.closeDevice();
    this.emitState(
      createIdleState({
        connectionState: 'disconnected',
        reconnectAttempt: 0,
        connectedDeviceCount: 0
      })
    );
  }

  private connectIfNeeded(): void {
    const connectedDevices = this.resolveDevices();
    const selectedDevice = selectGamepadDevice(
      connectedDevices,
      this.hidDevicePath
    );

    if (!selectedDevice) {
      this.reconnectAttempt += 1;
      if (this.hidDevice) {
        this.closeDevice();
      }
      this.emitState(
        createIdleState({
          connectionState: 'reconnecting',
          reconnectAttempt: this.reconnectAttempt,
          connectedDeviceCount: connectedDevices.length
        })
      );
      return;
    }

    if (
      this.hidDevice &&
      this.hidDevicePath === selectedDevice.info.path &&
      this.activeDevice?.profile.name === selectedDevice.profile.name
    ) {
      return;
    }

    this.openDevice(selectedDevice, connectedDevices.length);
  }

  private resolveDevices(): ResolvedGamepadDevice[] {
    if (!this.nodeHid) {
      return [];
    }

    return resolveConnectedGamepadDevices(this.nodeHid.devices());
  }

  private openDevice(
    selectedDevice: ResolvedGamepadDevice,
    connectedDeviceCount: number
  ): void {
    this.closeDevice();

    try {
      if (!this.nodeHid) {
        throw new Error('node-hid unavailable');
      }

      this.hidDevice = new this.nodeHid.HID(selectedDevice.info.path as string);
      this.hidDevicePath = selectedDevice.info.path as string;
      this.activeDeviceInfo = selectedDevice.info;
      this.activeDevice = selectedDevice;
      this.reconnectAttempt = 0;
      this.debugLogger.setCurrentDevice(this.activeDeviceInfo);

      this.debugLogger.info(
        `connected: profile=${selectedDevice.profile.name} product=${selectedDevice.info.product ?? 'unknown'} vendorId=${this.formatHex(
          selectedDevice.info.vendorId
        )} productId=${this.formatHex(selectedDevice.info.productId)} path=${selectedDevice.info.path}`
      );

      this.emitState(
        createIdleState({
          connectionState: 'connected',
          reconnectAttempt: this.reconnectAttempt,
          connectedDeviceCount,
          selectedDeviceInfo: selectedDevice.info
        })
      );

      this.hidDevice.on('data', (data: Buffer) => {
        this.onRawData(data);
      });

      this.hidDevice.on('error', () => {
        this.onDeviceError();
      });
    } catch {
      this.onOpenFailed();
    }
  }

  private onRawData(data: Buffer): void {
    this.debugLogger.rawReport(data);

    const report = parseHidReport(
      data,
      this.activeDeviceInfo ?? undefined,
      this.activeDevice?.profile.parser
    );

    if (!report) {
      this.debugLogger.info('report parse skipped (unknown format)');
      return;
    }

    this.debugLogger.parsedReport(report);
    this.emitConnectedState(report);
  }

  private emitConnectedState(report: ParsedReport): void {
    this.emitState(
      createConnectedState({
        report,
        reconnectAttempt: this.reconnectAttempt,
        connectedDeviceCount: this.resolveDevices().length,
        selectedDeviceInfo: this.activeDeviceInfo
      })
    );
  }

  private onDeviceError(): void {
    this.debugLogger.info('hid error detected; closing device');
    this.closeDevice();
    this.reconnectAttempt += 1;
    this.emitState(
      createIdleState({
        connectionState: 'reconnecting',
        reconnectAttempt: this.reconnectAttempt,
        connectedDeviceCount: this.resolveDevices().length
      })
    );
  }

  private onOpenFailed(): void {
    this.debugLogger.info('failed to open hid device');
    this.closeDevice();
    this.reconnectAttempt += 1;
    this.emitState(
      createIdleState({
        connectionState: 'reconnecting',
        reconnectAttempt: this.reconnectAttempt,
        connectedDeviceCount: this.resolveDevices().length
      })
    );
  }

  private closeDevice(): void {
    if (!this.hidDevice) {
      this.hidDevicePath = null;
      this.activeDeviceInfo = null;
      this.activeDevice = null;
      this.debugLogger.setCurrentDevice(null);
      return;
    }

    try {
      this.hidDevice.removeAllListeners('data');
      this.hidDevice.removeAllListeners('error');
      this.hidDevice.close();
    } catch {
      // noop
    }

    this.hidDevice = null;
    this.hidDevicePath = null;
    this.activeDeviceInfo = null;
    this.activeDevice = null;
    this.debugLogger.setCurrentDevice(null);
    this.debugLogger.info('device closed');
  }

  private formatHex(value?: number): string {
    if (typeof value !== 'number') {
      return 'n/a';
    }

    return `0x${value.toString(16).padStart(4, '0')}`;
  }

  private emitState(state: NativeGamepadState): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    this.mainWindow.webContents.send(NATIVE_GAMEPAD_STATE_CHANNEL, state);
  }
}

const debugConfig: NativeGamepadDebugConfig = createDebugConfigFromEnv(
  process.env
);
const debugLogger = new NativeGamepadDebugLogger(
  debugConfig,
  path.join(app.getPath('userData'), 'logs')
);
const nativeHidGamepadBridge = new NativeHidGamepadBridge(debugLogger);

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // 開発者ツールは本番ビルドでは開かない
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  nativeHidGamepadBridge.start(mainWindow);

  mainWindow.on('closed', () => {
    nativeHidGamepadBridge.stop();
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  nativeHidGamepadBridge.stop();
});
