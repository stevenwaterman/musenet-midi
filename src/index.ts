import "lodash/common/collection";
import {fromMidiToMusenet} from "./fromMidi";
import {fromMusenetToMidi} from "./toMidi";

export const fromMidi = fromMidiToMusenet;
export const toMidi = fromMusenetToMidi;
