"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const midi_file_1 = require("midi-file");
const instruments_1 = require("./instruments");
function parseMidiFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = (readerEvent) => {
                const target = readerEvent.target;
                if (target !== null) {
                    const result = target.result;
                    if (result !== null) {
                        const midiData = midi_file_1.parseMidi(new Uint8Array(result));
                        resolve(midiData);
                    }
                }
            };
        });
    });
}
function withStartTimes(track, timeDivision) {
    const output = [];
    let startTime = 0;
    for (let event of track) {
        startTime += event.deltaTime * timeDivision;
        output.push(Object.assign(Object.assign({}, event), { startTime }));
    }
    return output;
}
function getTimeDivision(header) {
    if ("timeDivision" in header) {
        return header.timeDivision;
    }
    if ("ticksPerBeat" in header) {
        return 48 / header.ticksPerBeat;
    }
    if ("ticksPerFrame" in header) {
        return 1000000 / (header.ticksPerFrame * header.framesPerSecond);
    }
    return 48;
}
function mergeTracks(midi) {
    const merged = [];
    const timeDivision = getTimeDivision(midi.header);
    midi.tracks.map(track => withStartTimes(track, timeDivision)).forEach(it => merged.push(...it));
    merged.sort((a, b) => a.startTime - b.startTime);
    return merged;
}
function getWaitTokens(waitTime) {
    const tokens = [];
    const fullBlocks = Math.floor(waitTime / 128);
    for (let i = 0; i < fullBlocks; i++) {
        tokens.push(4095);
    }
    const lastBlock = waitTime % 128;
    if (lastBlock) {
        tokens.push(3967 + lastBlock);
    }
    return tokens;
}
function toMusenetEncoding(mergedTrack) {
    const encoding = [];
    let lastStartTime = 0;
    const currentInstruments = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let event of mergedTrack) {
        const waitTime = event.startTime - lastStartTime;
        encoding.push(...getWaitTokens(waitTime));
        lastStartTime = event.startTime;
        if (event.type == "programChange") {
            currentInstruments[event.channel] = event.programNumber;
            continue;
        }
        if (event.type == "noteOn") {
            const instrument = currentInstruments[event.channel];
            const { on } = instruments_1.getInstrumentInfo(instrument, event.channel);
            encoding.push(event.noteNumber + on * 128);
            continue;
        }
        if (event.type == "noteOff") {
            const instrument = currentInstruments[event.channel];
            const { off } = instruments_1.getInstrumentInfo(instrument, event.channel);
            if (off !== null) {
                encoding.push(event.noteNumber + off * 128);
                // noinspection UnnecessaryContinueJS
                continue;
            }
        }
    }
    return encoding;
}
function fromMidiToMusenet(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const midiData = yield parseMidiFile(file);
        const mergedTrack = mergeTracks(midiData);
        return toMusenetEncoding(mergedTrack);
    });
}
exports.fromMidiToMusenet = fromMidiToMusenet;
//# sourceMappingURL=fromMidi.js.map