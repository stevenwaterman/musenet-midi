import {MidiData, MidiEvent, MidiTrack, parseMidi} from "midi-file";
import _ from "lodash";
import {getInstrumentInfo, MusenetEncoding} from "./instruments";

async function parseMidiFile(file: File): Promise<MidiData> {
    return new Promise<MidiData>(resolve => {
        const reader: FileReader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = (readerEvent: ProgressEvent<FileReader>) => {
            const result = readerEvent.target.result as ArrayBuffer;
            const midiData: MidiData = parseMidi(new Uint8Array(result));
            resolve(midiData);
        }
    })
}

type ObjectWithStartTime = { startTime: number };
type MidiEventWithStartTime = MidiEvent & ObjectWithStartTime;

type MidiTrackWithStartTime = MidiEventWithStartTime[];

function withStartTimes(track: MidiTrack): MidiTrackWithStartTime {
    const output: MidiTrackWithStartTime = [];
    let startTime = 0;
    for (let event of track) {
        startTime += event.deltaTime;
        output.push({
            ...event,
            startTime
        });
    }
    return output;
}

function mergeTracks(midi: MidiData) {
    const merged: MidiTrackWithStartTime = _.flatMap<MidiTrack, MidiEventWithStartTime>(midi.tracks, withStartTimes);
    merged.sort((a: ObjectWithStartTime, b: ObjectWithStartTime) => b.startTime - a.startTime);
    return merged;
}

function getWaitTokens(waitTime: number): number[] {
    const tokens: number[] = [];
    const fullBlocks = waitTime / 128;
    for (let i = 0; i < fullBlocks; i++) {
        tokens.push(3967 + 128);
    }
    const lastBlock = waitTime % 128;
    if (lastBlock) {
        tokens.push(3967 + lastBlock);
    }
    return tokens;
}

function toMusenetEncoding(mergedTrack: MidiTrackWithStartTime): MusenetEncoding {
    const tokens: number[] = [];
    let lastStartTime = 0;
    const currentInstruments = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (let event of mergedTrack) {
        const waitTime = event.startTime - lastStartTime;
        tokens.push(...getWaitTokens(waitTime));
        lastStartTime = event.startTime;

        if (event.type == "programChange") {
            currentInstruments[event.channel] = event.programNumber;
            continue;
        }

        if (event.type == "noteOn") {
            const instrument = currentInstruments[event.channel];
            const {on} = getInstrumentInfo(instrument, event.channel);
            tokens.push(event.noteNumber + on * 128);
            continue;
        }

        if (event.type == "noteOff") {
            const instrument = currentInstruments[event.channel];
            const {off} = getInstrumentInfo(instrument, event.channel);
            tokens.push(event.noteNumber + off * 128);
            // noinspection UnnecessaryContinueJS
            continue;
        }
    }
    return tokens;
}

export async function fromMidiToMusenet(file: File): Promise<MusenetEncoding> {
    const midiData: MidiData = await parseMidiFile(file);
    const mergedTrack: MidiEventWithStartTime[] = mergeTracks(midiData);
    return toMusenetEncoding(mergedTrack);
}
