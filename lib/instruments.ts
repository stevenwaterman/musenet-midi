type InstrumentMapping = {
    voices: number[];
    on: number;
    off: number;
}

export type Instrument =
    "piano" | "violin" | "cello" | "bass" | "guitar" | "flute" | "clarinet" | "trumpet" | "harp" | "drum";

export const instrumentChannels: Record<Instrument, number> = {
    piano: 0, violin: 1, cello: 2, bass: 3, guitar: 4, flute: 5, clarinet: 6, trumpet: 7, harp: 8, drum: 9
};

const violin: InstrumentMapping = {voices: [40, 41, 44, 45, 48, 49, 50, 51], on: 14, off: 15};
const cello: InstrumentMapping = {voices: [42, 43], on: 16, off: 17};
const bass: InstrumentMapping = {voices: [32, 33, 34, 35, 36, 37, 38, 39], on: 18, off: 19};
const guitar: InstrumentMapping = {voices: [24, 25, 26, 27, 28, 29, 30, 31], on: 20, off: 21};
const flute: InstrumentMapping = {voices: [72, 73, 74, 75, 76, 77, 78, 79], on: 22, off: 23};
const clarinet: InstrumentMapping = {voices: [64, 65, 66, 67, 68, 69, 70, 71], on: 24, off: 25};
const trumpet: InstrumentMapping = {voices: [56, 57, 58, 59, 60, 61, 62, 63], on: 26, off: 27};
const harp: InstrumentMapping = {voices: [46], on: 28, off: 29};
const instruments: InstrumentMapping[] = [violin, cello, bass, guitar, flute, clarinet, trumpet, harp];

export function getInstrumentInfo(voice: number, channel: number): {
    on: number,
    off: number | null
} {
    // Drums are special
    if (channel === instrumentChannels.drum) return {on: 30, off: null};

    const found: InstrumentMapping | undefined = instruments.find(x => x.voices.indexOf(voice) > -1);
    if (found) return found;

    // Piano is complicated
    return {on: 8, off: 0};
}

export type MusenetEncoding = number[];
