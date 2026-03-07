import type nodeHid from 'node-hid';

export type HidDeviceInfo = ReturnType<typeof nodeHid.devices>[number];
