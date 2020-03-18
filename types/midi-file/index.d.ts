declare module "midi-file" {


    type MidiEventBase<TYPE extends string> = {
        deltaTime: number;
        type: TYPE
    }

    type MidiEventMetaBase<TYPE extends string> = MidiEventBase<TYPE> & { meta: true }

    type MidiEventChannelBase<TYPE extends string> = MidiEventBase<TYPE> & {
        running?: true;
        channel: number;
    };

    export type MidiEventSequenceNumber = MidiEventMetaBase<"sequenceNumber"> & {
        number: number;
    }

    export type MidiEventText = MidiEventMetaBase<"text"> & {
        text: string;
    }

    export type MidiEventCopyrightNotice = MidiEventMetaBase<"copyrightNotice"> & {
        text: string;
    }

    export type MidiEventTrackName = MidiEventMetaBase<"trackName"> & {
        text: string;
    }

    export type MidiEventInstrumentName = MidiEventMetaBase<"instrumentName"> & {
        text: string;
    }

    export type MidiEventLyrics = MidiEventMetaBase<"lyrics"> & {
        text: string;
    }

    export type MidiEventMarker = MidiEventMetaBase<"marker"> & {
        text: string;
    }

    export type MidiEventCuePoint = MidiEventMetaBase<"cuePoint"> & {
        text: string;
    }

    export type MidiEventChannelPrefix = MidiEventMetaBase<"channelPrefix"> & {
        channel: number;
    }

    export type MidiEventPortPrefix = MidiEventMetaBase<"portPrefix"> & {
        port: number;
    }

    export type MidiEventEndOfTrack = MidiEventMetaBase<"endOfTrack">;

    export type MidiEventSetTempo = MidiEventMetaBase<"setTempo"> & {
        microsecondsPerBeat: number;
    }

    export type MidiEventSmpteOffset = MidiEventMetaBase<"smpteOffset"> & {
        frameRate: 24 | 25 | 29 | 30;
        hour: number;
        min: number;
        sec: number;
        frame: number;
        subFrame: number;
    }

    export type MidiEventTimeSignature = MidiEventMetaBase<"timeSignature"> & {
        numerator: number;
        denominator: number;
        metronome: number;
        thirtyseconds: number;
    }

    export type MidiEventKeySignature = MidiEventMetaBase<"keySignature"> & {
        key: number;
        scale: number;
    }

    export type MidiEventSequencerSpecific = MidiEventMetaBase<"sequencerSpecific"> & {
        data: Uint8Array;
    }

    export type MidiEventUnknownMeta = MidiEventMetaBase<"unknownMeta"> & {
        data: Uint8Array;
        metatypeByte: number;
    }

    export type MidiEventSysEx = MidiEventBase<"sysEx"> & {
        data: Uint8Array
    }

    export type MidiEventEndSysEx = MidiEventBase<"endSysEx"> & {
        data: Uint8Array
    }

    type MidiEventNoteOff_1 = MidiEventChannelBase<"noteOff"> & {
        noteNumber: number;
        velocity: number;
    }

    /**
     * This only occurs when the event is encoded as noteOn but with velocity 0
     */
    type MidiEventNoteOff_2 = MidiEventChannelBase<"noteOff"> & {
        noteNumber: number;
        velocity: 0;
        byte9: true;
    }

    export type MidiEventNoteOff = MidiEventNoteOff_1 | MidiEventNoteOff_2;

    /**
     * If velocity is 0 then noteOn event is parsed as noteOff.
     * Specifically, it will be parsed as the MidiEventNoteOff_2 type.
     */
    export type MidiEventNoteOn = MidiEventChannelBase<"noteOn"> & {
        noteNumber: number;
        velocity: number; // velocity != 0
    }

    export type MidiEventNoteAftertouch = MidiEventChannelBase<"noteAftertouch"> & {
        noteNumber: number;
        amount: number;
    }

    export type MidiEventController = MidiEventChannelBase<"controller"> & {
        controllerType: number;
        value: number;
    }

    export type MidiEventProgramChange = MidiEventChannelBase<"programChange"> & {
        programNumber: number;
    }

    export type MidiEventChannelAftertouch = MidiEventChannelBase<"channelAftertouch"> & {
        amount: number;
    }

    export type MidiEventPitchBend = MidiEventChannelBase<"pitchBend"> & {
        value: number;
    }

    export type MidiEvent =
        MidiEventSequenceNumber
        | MidiEventText
        | MidiEventCopyrightNotice
        | MidiEventTrackName
        | MidiEventInstrumentName
        | MidiEventLyrics
        | MidiEventMarker
        | MidiEventCuePoint
        | MidiEventChannelPrefix
        | MidiEventPortPrefix
        | MidiEventEndOfTrack
        | MidiEventSetTempo
        | MidiEventSmpteOffset
        | MidiEventTimeSignature
        | MidiEventKeySignature
        | MidiEventSequencerSpecific
        | MidiEventUnknownMeta
        | MidiEventSysEx
        | MidiEventEndSysEx
        | MidiEventNoteOff
        | MidiEventNoteOn
        | MidiEventNoteAftertouch
        | MidiEventController
        | MidiEventProgramChange
        | MidiEventChannelAftertouch
        | MidiEventPitchBend;

    type MidiHeaderBase = {
        format?: number;
        numTracks: number;
    }

    type MidiHeaderTimeDivision = MidiHeaderBase & {
        timeDivision: number;
    }

    type MidiHeaderFrames = MidiHeaderBase & {
        ticksPerFrame: number;
        framesPerSecond: number;
    }

    type MidiHeaderBeats = MidiHeaderBase & {
        ticksPerBeat: number;
    }

    export type MidiHeader = MidiHeaderTimeDivision | MidiHeaderFrames | MidiHeaderBeats

    export type MidiTrack = MidiEvent[];

    export type MidiData = {
        header: MidiHeader;
        tracks: MidiTrack[];
    }

    export type WriteMidiOptions = {
        running: boolean;
        useByte9ForNoteOff: boolean;
    }

    export function parseMidi(data: Uint8Array): MidiData;

    export function writeMidi(data: MidiData, opts?: WriteMidiOptions): Uint8Array;
}