export type TimeSignature = "4/4" | "3/4" | "6/8";

export type NoteType = "dottedHalf" | "half" | "dottedQuarter" | "quarter" | "dottedEighth" | "eighth" | "sixteenth";

export interface RhythmNote {
  type: NoteType;
  units: number;
}

export interface GeneratedQuestion {
  questionId: string;
  timeSignature: TimeSignature;
  measures: RhythmNote[][];
  rhythm: RhythmNote[];
  accentUnitOffsets: number[];
}

export interface ValidateResult {
  isCorrect: boolean;
  expectedUnits: number;
  currentUnits: number;
}
