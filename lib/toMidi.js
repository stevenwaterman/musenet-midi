"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const midi_file_1 = require("midi-file");
const instruments_1 = require("./instruments");
function fromMusenetToMidi(encoded) {
    const midiData = {
        header: {
            format: 1,
            numTracks: 10,
            ticksPerBeat: 48
        },
        tracks: [
            [{ deltaTime: 0, channel: 0, type: "programChange", programNumber: 0 }],
            [{ deltaTime: 0, channel: 1, type: "programChange", programNumber: 40 }],
            [{ deltaTime: 0, channel: 2, type: "programChange", programNumber: 42 }],
            [{ deltaTime: 0, channel: 3, type: "programChange", programNumber: 32 }],
            [{ deltaTime: 0, channel: 4, type: "programChange", programNumber: 24 }],
            [{ deltaTime: 0, channel: 5, type: "programChange", programNumber: 73 }],
            [{ deltaTime: 0, channel: 6, type: "programChange", programNumber: 71 }],
            [{ deltaTime: 0, channel: 7, type: "programChange", programNumber: 56 }],
            [{ deltaTime: 0, channel: 8, type: "programChange", programNumber: 46 }],
            [{ deltaTime: 0, channel: 9, type: "programChange", programNumber: 0 }]
        ]
    };
    const tokens = encoded.map(parseToken).filter(it => it !== null);
    const deltaTime = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    tokens.forEach(token => {
        if (token.type === "note") {
            const trackIndex = instruments_1.instrumentChannels[token.instrument];
            if (token.volume === 0) {
                midiData.tracks[trackIndex].push({
                    deltaTime: deltaTime[trackIndex],
                    channel: trackIndex,
                    type: "noteOff",
                    noteNumber: token.pitch,
                    velocity: token.volume
                });
            }
            else {
                midiData.tracks[trackIndex].push({
                    deltaTime: deltaTime[trackIndex],
                    channel: trackIndex,
                    type: "noteOn",
                    noteNumber: token.pitch,
                    velocity: token.volume
                });
                if (token.instrument === "drum") {
                    midiData.tracks[9].push({
                        deltaTime: 0,
                        channel: 9,
                        type: "noteOff",
                        "noteNumber": token.pitch,
                        "velocity": 0
                    });
                }
            }
            deltaTime[trackIndex] = 0;
        }
        else if (token.type === "wait") {
            for (let j = 0; j < 10; j++) {
                deltaTime[j] += token.delay;
            }
        }
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
    const midiBytes = new Uint8Array(midi_file_1.writeMidi(midiData));
    return new Blob([midiBytes], { type: "audio/midi" });
}
exports.fromMusenetToMidi = fromMusenetToMidi;
const tokenInfo = [
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
function parseToken(token) {
    if (token >= 0 && token < 3840) {
        const [instrument, volume] = tokenInfo[token >> 7];
        return { type: "note", pitch: token % 128, instrument, volume };
    }
    if (token < 3968)
        return { type: "note", pitch: token % 128, instrument: "drum", volume: 80 };
    if (token < 4096)
        return { type: "wait", delay: (token % 128) + 1 };
    if (token == 4096)
        return { type: "start" };
    return null;
}
exports.parseToken = parseToken;
//# sourceMappingURL=toMidi.js.map