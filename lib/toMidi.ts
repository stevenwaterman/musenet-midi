import {MidiData, writeMidi} from "./index";
import {Instrument, instrumentChannels, MusenetEncoding} from "./instruments";

export function fromMusenetToMidi(encoded: MusenetEncoding): Blob {
    const midiData: MidiData = {
        header: {
            format: 1,
            numTracks: 10,
            ticksPerBeat: 48
        },
        tracks: [
            [{deltaTime: 0, channel: 0, type: "programChange", programNumber: 0}],
            [{deltaTime: 0, channel: 1, type: "programChange", programNumber: 40}],
            [{deltaTime: 0, channel: 2, type: "programChange", programNumber: 42}],
            [{deltaTime: 0, channel: 3, type: "programChange", programNumber: 32}],
            [{deltaTime: 0, channel: 4, type: "programChange", programNumber: 24}],
            [{deltaTime: 0, channel: 5, type: "programChange", programNumber: 73}],
            [{deltaTime: 0, channel: 6, type: "programChange", programNumber: 71}],
            [{deltaTime: 0, channel: 7, type: "programChange", programNumber: 56}],
            [{deltaTime: 0, channel: 8, type: "programChange", programNumber: 46}],
            [{deltaTime: 0, channel: 9, type: "programChange", programNumber: 0}]
        ]
    };

    const tokens: Token[] = encoded.map(parseToken);

    const usedDrumNotes: Set<number> = new Set<number>();
    const deltaTime = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    tokens.forEach(token => {
        if (token.type === "note") {
            const trackIndex = instrumentChannels[token.instrument];
            midiData.tracks[trackIndex].push({
                deltaTime: deltaTime[trackIndex],
                channel: trackIndex,
                type: token.volume > 0 ? "noteOn" : "noteOff",
                noteNumber: token.pitch,
                velocity: token.volume
            });
            if (token.instrument == "drum") usedDrumNotes.add(token.pitch);
            deltaTime[trackIndex] = 0;
        } else if (token.type == "wait") {
            for (let j = 0; j < 10; j++) {
                deltaTime[j] += token.delay;
            }
        }
    });

    usedDrumNotes.forEach(pitch => {
        midiData.tracks[9].push({
            deltaTime: deltaTime[9],
            channel: 9,
            type: "noteOff",
            "noteNumber": pitch,
            "velocity": 0
        });
        deltaTime[9] = 0;
    });

    midiData.tracks.forEach((track, idx) => {
        track.push({
            deltaTime: deltaTime[idx],
            "meta": true,
            type: "endOfTrack"
        });
        deltaTime[idx] = 0;
    });

    midiData.tracks = midiData.tracks.filter(track => track.length > 2);
    midiData.header.numTracks = midiData.tracks.length;

    const midiBytes = new Uint8Array(writeMidi(midiData));
    return new Blob([midiBytes], {type: "audio/midi"});
}

type TokenBase<TYPE extends string> = {
    type: TYPE
}

type TokenNote = TokenBase<"note"> & {
    pitch: number;
    instrument: Instrument;
    volume: number;
}

type TokenWait = TokenBase<"wait"> & {
    delay: number;
}

type TokenStart = TokenBase<"start">

export type Token = TokenNote | TokenWait | TokenStart;

const tokenInfo: Array<[Instrument, number]> = [
    ["piano", 0],
    ["piano", 24],
    ["piano", 32],
    ["piano", 40],
    ["piano", 48],
    ["piano", 56],
    ["piano", 64],
    ["piano", 72],
    ["piano", 80],
    ["piano", 88],
    ["piano", 96],
    ["piano", 104],
    ["piano", 112],
    ["piano", 120],
    ["violin", 80],
    ["violin", 0],
    ["cello", 80],
    ["cello", 0],
    ["bass", 80],
    ["bass", 0],
    ["guitar", 80],
    ["guitar", 0],
    ["flute", 80],
    ["flute", 0],
    ["clarinet", 80],
    ["clarinet", 0],
    ["trumpet", 80],
    ["trumpet", 0],
    ["harp", 80],
    ["harp", 0]
];

export function parseToken(token: number): Token {
    if (token >= 0 && token < 3840) {
        const [instrument, volume] = tokenInfo[token >> 7];
        return {type: "note", pitch: token % 128, instrument, volume};
    }
    if (token < 3968) return {type: "note", pitch: token % 128, instrument: "drum", volume: 80};
    if (token < 4096) return {type: "wait", delay: (token % 128) + 1};
    if (token == 4096) return {type: "start"};
    throw new Error("Unrecognised token " + token);
}