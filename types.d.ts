import { Connection } from "mongoose"
declare global{
    var mongoose: {
        conn: Connection | null,
        promise: Promise<Connection> | null
    }
      interface Window {
    fbq: (
      track: 'track' | 'trackCustom' | 'init',
      eventName: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void;
  }
}

export {};