export declare type Instrument = "piano" | "violin" | "cello" | "bass" | "guitar" | "flute" | "clarinet" | "trumpet" | "harp" | "drum";
export declare const instrumentChannels: Record<Instrument, number>;
export declare function getInstrumentInfo(voice: number, channel: number): {
    on: number;
    off: number | null;
};
export declare type MusenetEncoding = number[];
