declare global {
  interface BatteryManager {
    charging: boolean;
    level: number; // 0..1
    chargingTime?: number;
    dischargingTime?: number;
    addEventListener?: (type: string, listener: (ev: Event) => any) => void;
    removeEventListener?: (type: string, listener: (ev: Event) => any) => void;
  }

  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
  }
}

export {};