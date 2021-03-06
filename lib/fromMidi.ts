import {MidiData, MidiEvent, MidiHeader, MidiTrack, parseMidi} from "midi-file";
import {getInstrumentInfo, MusenetEncoding} from "./instruments";

async function parseMidiFile(file: File): Promise<MidiData> {
    return new Promise<MidiData>(resolve => {
        const reader: FileReader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = (readerEvent: ProgressEvent<FileReader>) => {
            const target = readerEvent.target;
            if (target !== null) {
                const result = target.result;
                if(result !== null) {
                    const midiData: MidiData = parseMidi(new Uint8Array(result as ArrayBuffer));
                    resolve(midiData);
                }
            }
        }
    })
}

type ObjectWithStartTime = { startTime: number };
type MidiEventWithStartTime = MidiEvent & ObjectWithStartTime;

type MidiTrackWithStartTime = MidiEventWithStartTime[];

function withStartTimes(track: MidiTrack, timeDivision: number): MidiTrackWithStartTime {
    const output: MidiTrackWithStartTime = [];
    let startTime = 0;
    for (let event of track) {
        startTime += event.deltaTime * timeDivision;
        output.push({
            ...event,
            startTime
        });
    }
    return output;
}

function getTimeDivision(header: MidiHeader): number {
    if("timeDivision" in header) {
        return header.timeDivision;
    }
    if("ticksPerBeat" in header) {
        return 48 / header.ticksPerBeat;
    }
    if("ticksPerFrame" in header) {
        return 1_000_000 / (header.ticksPerFrame * header.framesPerSecond);
    }
    return 48;
}

function mergeTracks(midi: MidiData) {
    const merged: MidiTrackWithStartTime = [];
    const timeDivision = getTimeDivision(midi.header);
    midi.tracks.map(track => withStartTimes(track, timeDivision)).forEach(it => merged.push(...it));
    merged.sort((a: ObjectWithStartTime, b: ObjectWithStartTime) => a.startTime - b.startTime);
    return merged;
}

function getWaitTokens(waitTime: number, bpm: number): number[] {
    const tokens: number[] = [];

    const adjustment = 120 / bpm;
    const delay = waitTime * adjustment;

    const fullBlocks = Math.floor(delay / 128);

    for (let i = 0; i < fullBlocks; i++) {
        tokens.push(4095);
    }
    const lastBlock = delay % 128;
    if (lastBlock) {
        tokens.push(3967 + lastBlock);
    }
    return tokens;
}

function toMusenetEncoding(mergedTrack: MidiTrackWithStartTime): MusenetEncoding {
    const encoding: MusenetEncoding = [];
    let lastStartTime = 0;
    const currentInstruments = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let bpm = 120;

    for (let event of mergedTrack) {
        const waitTime = event.startTime - lastStartTime;
        encoding.push(...getWaitTokens(waitTime, bpm));
        lastStartTime = event.startTime;

        if (event.type === "setTempo") {
            bpm = 60 * 1000 * 1000 / event.microsecondsPerBeat;
            continue;
        }

        if (event.type === "programChange") {
            currentInstruments[event.channel] = event.programNumber;
            continue;
        }

        if (event.type === "noteOn") {
            const instrument = currentInstruments[event.channel];
            const {on} = getInstrumentInfo(instrument, event.channel);
            encoding.push(event.noteNumber + on * 128);
            continue;
        }

        if (event.type === "noteOff") {
            const instrument = currentInstruments[event.channel];
            const {off} = getInstrumentInfo(instrument, event.channel);
            if(off !== null) {
                encoding.push(event.noteNumber + off * 128);
                // noinspection UnnecessaryContinueJS
                continue;
            }
        }
    }
    return encoding;
}

export async function fromMidiToMusenet(file: File): Promise<MusenetEncoding> {
    const midiData: MidiData = await parseMidiFile(file);
    const mergedTrack: MidiTrackWithStartTime = mergeTracks(midiData);
    return toMusenetEncoding(mergedTrack);
}
