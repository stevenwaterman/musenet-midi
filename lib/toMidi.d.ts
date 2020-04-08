import { Instrument, MusenetEncoding } from "./instruments";
export declare function fromMusenetToMidi(encoded: MusenetEncoding): Blob;
declare type TokenBase<TYPE extends string> = {
    type: TYPE;
};
declare type TokenNote = TokenBase<"note"> & {
    pitch: number;
    instrument: Instrument;
    volume: number;
};
declare type TokenWait = TokenBase<"wait"> & {
    delay: number;
};
declare type TokenStart = TokenBase<"start">;
export declare type Token = TokenNote | TokenWait | TokenStart;
export declare function parseToken(token: number): Token | null;
export {};
