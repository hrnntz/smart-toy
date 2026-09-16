import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid, EmitterSubscription } from 'react-native';

const { PandaBluetooth } = NativeModules;
const pandaEventEmitter = PandaBluetooth ? new NativeEventEmitter(PandaBluetooth) : null;

export interface PairedDevice {
  name: string;
  address: string;
}

export const requestBluetoothPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const apiLevel = Platform.Version;
    if (typeof apiLevel === 'number' && apiLevel >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);
      return (
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  } catch (err) {
    console.warn('Error solicitando permisos BT:', err);
    return false;
  }
};

export const pandaBluetooth = {
  isAvailable: (): boolean => {
    return !!PandaBluetooth;
  },

  getAppFlavor: (): string => {
    const native = PandaBluetooth as any;
    if (native?.appFlavor) return native.appFlavor;
    if (native?.applicationId === 'com.anonymous.smarttoydevice') return 'toy';
    if (native?.getConstants?.()?.appFlavor) return native.getConstants().appFlavor;
    return 'parent';
  },

  isConnected: async (): Promise<boolean> => {
    if (!PandaBluetooth) return false;
    try {
      return await PandaBluetooth.isConnected();
    } catch {
      return false;
    }
  },

  listPairedDevices: async (): Promise<PairedDevice[]> => {
    if (!PandaBluetooth) return [];
    await requestBluetoothPermissions();
    try {
      return await PandaBluetooth.listPairedDevices();
    } catch (err) {
      console.warn('Error listando dispositivos BT:', err);
      return [];
    }
  },

  connect: async (targetName = 'Panda_Fisico_BT'): Promise<boolean> => {
    if (!PandaBluetooth) throw new Error('Módulo PandaBluetooth no disponible en este dispositivo');
    await requestBluetoothPermissions();
    return await PandaBluetooth.connect(targetName);
  },

  sendHug: async (): Promise<boolean> => {
    if (!PandaBluetooth) throw new Error('Módulo PandaBluetooth no disponible');
    return await PandaBluetooth.sendHug();
  },

  sendCommand: async (cmd: string): Promise<boolean> => {
    if (!PandaBluetooth) throw new Error('Módulo PandaBluetooth no disponible');
    return await PandaBluetooth.sendCommand(cmd);
  },

  disconnect: async (): Promise<boolean> => {
    if (!PandaBluetooth) return true;
    try {
      return await PandaBluetooth.disconnect();
    } catch {
      return false;
    }
  },

  onData: (callback: (line: string) => void): EmitterSubscription | null => {
    if (!pandaEventEmitter) return null;
    return pandaEventEmitter.addListener('onPandaDataReceived', callback);
  },

  onConnectionChange: (callback: (connected: boolean) => void): EmitterSubscription | null => {
    if (!pandaEventEmitter) return null;
    return pandaEventEmitter.addListener('onPandaConnectionChanged', callback);
  },
};
