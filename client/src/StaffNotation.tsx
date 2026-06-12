import { useEffect, useRef } from "react";
import { Beam, Dot, Formatter, Fraction, Renderer, Stave, StaveNote, StaveTie, Voice } from "vexflow";
import { MEASURE_UNITS, splitIntoMeasures } from "./music";
import type { RhythmNote, TimeSignature } from "./types";

interface DisplayNote {
  duration: string;
  dotted: boolean;
  units: number;
  tieGroupId?: string;
}

const DISPLAY_DURATION_BY_UNITS: Record<number, { duration: string; dotted: boolean }> = {
  1: { duration: "16", dotted: false },
  2: { duration: "8", dotted: false },
  3: { duration: "8", dotted: true },
  4: { duration: "q", dotted: false },
  6: { duration: "q", dotted: true },
  8: { duration: "h", dotted: false },
  12: { duration: "h", dotted: true }
};

interface StaffNotationProps {
  notes: RhythmNote[];
  timeSignature: TimeSignature;
}

export function StaffNotation({ notes, timeSignature }: StaffNotationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.innerHTML = "";

    const width = Math.max(container.clientWidth, 680);
    const height = 210;
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, height);

    const context = renderer.getContext();
    const measureWidth = (width - 60) / 2;
    const y = 42;
    const splitNotes = splitIntoMeasures(notes, timeSignature);
    const tiesToDraw: StaveTie[] = [];

    splitNotes.forEach((measureNotes, index) => {
      const x = 26 + index * measureWidth;
      const stave = new Stave(x, y, measureWidth);

      if (index === 0) {
        stave.addClef("treble").addTimeSignature(timeSignature);
      }

      stave.setContext(context).draw();

      if (measureNotes.length === 0) {
        return;
      }

      const displayNotes = toDisplayNotes(measureNotes, timeSignature, index);
      const vexNotes = displayNotes.map((note) => {
        const staveNote = new StaveNote({
          keys: ["a/4"],
          duration: note.duration
        });

        if (note.dotted) {
          Dot.buildAndAttach([staveNote]);
        }

        return staveNote;
      });

      const voice = new Voice({
        numBeats: MEASURE_UNITS[timeSignature],
        beatValue: 16
      }).setStrict(false);

      voice.addTickables(vexNotes);
      new Formatter().joinVoices([voice]).format([voice], measureWidth - (index === 0 ? 86 : 44));
      voice.draw(context, stave);

      Beam.generateBeams(vexNotes, {
        groups: getBeamGroups(timeSignature),
        maintainStemDirections: true
      }).forEach((beam) => beam.setContext(context).draw());

      for (let noteIndex = 0; noteIndex < displayNotes.length - 1; noteIndex += 1) {
        const current = displayNotes[noteIndex];
        const next = displayNotes[noteIndex + 1];

        if (current.tieGroupId && current.tieGroupId === next.tieGroupId) {
          tiesToDraw.push(
            new StaveTie({
              firstNote: vexNotes[noteIndex],
              lastNote: vexNotes[noteIndex + 1],
              firstIndexes: [0],
              lastIndexes: [0]
            })
          );
        }
      }
    });

    tiesToDraw.forEach((tie) => tie.setContext(context).draw());
  }, [notes, timeSignature]);

  return <div className="notation-surface" ref={containerRef} aria-hidden="true" />;
}

function toDisplayNotes(notes: RhythmNote[], timeSignature: TimeSignature, measureIndex: number): DisplayNote[] {
  const groupUnits = timeSignature === "6/8" ? 6 : 4;
  const displayNotes: DisplayNote[] = [];
  let cursorUnits = 0;

  notes.forEach((note, noteIndex) => {
    let remainingUnits = note.units;
    const tieGroupId = `${measureIndex}-${noteIndex}`;
    const willSplit = crossesGroupBoundary(cursorUnits, note.units, groupUnits);

    while (remainingUnits > 0) {
      const unitsUntilBoundary = groupUnits - (cursorUnits % groupUnits || 0);
      const segmentUnits = Math.min(remainingUnits, unitsUntilBoundary);
      const duration = DISPLAY_DURATION_BY_UNITS[segmentUnits];

      displayNotes.push({
        ...duration,
        units: segmentUnits,
        tieGroupId: willSplit ? tieGroupId : undefined
      });

      remainingUnits -= segmentUnits;
      cursorUnits += segmentUnits;
    }
  });

  return displayNotes;
}

function crossesGroupBoundary(startUnits: number, durationUnits: number, groupUnits: number): boolean {
  const startGroup = Math.floor(startUnits / groupUnits);
  const endGroup = Math.floor((startUnits + durationUnits - 1) / groupUnits);
  return startGroup !== endGroup;
}

function getBeamGroups(timeSignature: TimeSignature): Fraction[] {
  return timeSignature === "6/8" ? [new Fraction(3, 8)] : [new Fraction(1, 4)];
}
