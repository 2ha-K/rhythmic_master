import type { GeneratedQuestion, PlacedNote, RhythmNote, TimeSignature } from "./types";

export const NOTE_CATALOG: RhythmNote[] = [
  { type: "dottedHalf", units: 12 },
  { type: "half", units: 8 },
  { type: "dottedQuarter", units: 6 },
  { type: "quarter", units: 4 },
  { type: "dottedEighth", units: 3 },
  { type: "eighth", units: 2 },
  { type: "sixteenth", units: 1 }
];

export const NOTE_LABELS: Record<RhythmNote["type"], string> = {
  dottedHalf: "Dotted half",
  half: "Half",
  dottedQuarter: "Dotted quarter",
  quarter: "Quarter",
  dottedEighth: "Dotted eighth",
  eighth: "Eighth",
  sixteenth: "Sixteenth"
};

export const MEASURE_UNITS: Record<TimeSignature, number> = {
  "4/4": 16,
  "3/4": 12,
  "6/8": 12
};

export const TOTAL_MEASURES = 2;
export const BPM = 90;

const COUNT_IN: Record<TimeSignature, { beats: number; beatUnits: number; accentBeats: number[] }> = {
  "4/4": { beats: 4, beatUnits: 4, accentBeats: [0] },
  "3/4": { beats: 3, beatUnits: 4, accentBeats: [0] },
  "6/8": { beats: 6, beatUnits: 2, accentBeats: [0, 3] }
};

let activePlaybackContext: AudioContext | null = null;

export function totalUnits(notes: RhythmNote[]): number {
  return notes.reduce((total, note) => total + note.units, 0);
}

export function canSequenceFit(notes: RhythmNote[], timeSignature: TimeSignature): boolean {
  const measureUnits = MEASURE_UNITS[timeSignature];
  let remaining = measureUnits;
  let measuresUsed = 1;

  for (const note of notes) {
    if (note.units > measureUnits) {
      return false;
    }

    if (note.units > remaining) {
      measuresUsed += 1;
      remaining = measureUnits;
    }

    if (measuresUsed > TOTAL_MEASURES || note.units > remaining) {
      return false;
    }

    remaining -= note.units;
  }

  return true;
}

export function splitIntoMeasures(notes: RhythmNote[], timeSignature: TimeSignature): RhythmNote[][] {
  const measureUnits = MEASURE_UNITS[timeSignature];
  const measures: RhythmNote[][] = [[], []];
  let measureIndex = 0;
  let remaining = measureUnits;

  for (const note of notes) {
    if (note.units > remaining) {
      measureIndex += 1;
      remaining = measureUnits;
    }

    if (measureIndex > 1 || note.units > remaining) {
      break;
    }

    measures[measureIndex].push(note);
    remaining -= note.units;
  }

  return measures;
}

export function makePlacedNote(note: RhythmNote): PlacedNote {
  return {
    ...note,
    id: `${note.type}-${crypto.randomUUID()}`
  };
}

export function playQuestion(question: GeneratedQuestion): void {
  stopQuestionPlayback();

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContextCtor();
  activePlaybackContext = context;
  const unitDuration = 60 / BPM / 4;
  const startTime = context.currentTime + 0.08;
  const countIn = COUNT_IN[question.timeSignature];
  const rhythmStartTime = startTime + countIn.beats * countIn.beatUnits * unitDuration;
  const measureUnits = MEASURE_UNITS[question.timeSignature];
  const accentOffsets = new Set(question.accentUnitOffsets);
  let cursorUnits = 0;

  for (let beatIndex = 0; beatIndex < countIn.beats; beatIndex += 1) {
    const clickStart = startTime + beatIndex * countIn.beatUnits * unitDuration;
    playMetronomeClick(context, clickStart, countIn.accentBeats.includes(beatIndex));
  }

  question.rhythm.forEach((note) => {
    const measureOffset = cursorUnits % measureUnits;
    const isAccent = question.timeSignature === "6/8" && accentOffsets.has(measureOffset);
    const noteStart = rhythmStartTime + cursorUnits * unitDuration;
    const noteLength = note.units * unitDuration;
    playA4(context, noteStart, noteLength, isAccent);
    cursorUnits += note.units;
  });
}

export function stopQuestionPlayback(): void {
  if (!activePlaybackContext) {
    return;
  }

  void activePlaybackContext.close();
  activePlaybackContext = null;
}

function playMetronomeClick(context: AudioContext, startTime: number, isAccent: boolean): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const duration = isAccent ? 0.07 : 0.045;
  const peak = isAccent ? 0.34 : 0.22;

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(isAccent ? 1760 : 1320, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.01);
}

function playA4(context: AudioContext, startTime: number, duration: number, isAccent: boolean): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const level = isAccent ? 0.3 : 0.18;
  const releaseStart = startTime + Math.max(0.04, duration * 0.72);
  const stopTime = startTime + duration;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(440, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(level, startTime + 0.015);
  gain.gain.setValueAtTime(level, releaseStart);
  gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(stopTime + 0.02);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
