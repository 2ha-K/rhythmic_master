import assert from "node:assert/strict";
import { generateQuestion, MEASURE_UNITS, NOTE_CATALOG, validateAnswer } from "./rhythm.js";
import type { TimeSignature } from "./types.js";

const signatures: TimeSignature[] = ["4/4", "3/4", "6/8"];
const noteUnits = Object.values(NOTE_CATALOG).map((note) => note.units).sort((a, b) => a - b);

assert.deepEqual(noteUnits, [1, 2, 3, 4, 6, 8, 12]);

for (const signature of signatures) {
  for (let index = 0; index < 100; index += 1) {
    const question = generateQuestion(signature);

    assert.equal(question.measures.length, 2);
    assert.equal(question.timeSignature, signature);
    assert.equal(question.rhythm.some((note) => note.units === 16), false);

    for (const measure of question.measures) {
      assert.equal(
        measure.reduce((total, note) => total + note.units, 0),
        MEASURE_UNITS[signature]
      );
    }

    if (signature === "6/8") {
      assert.deepEqual(question.accentUnitOffsets, [0, 6]);
    }
  }
}

const expected = [NOTE_CATALOG.quarter, NOTE_CATALOG.eighth, NOTE_CATALOG.sixteenth];
assert.equal(validateAnswer(expected, expected).isCorrect, true);
assert.equal(validateAnswer(expected, [NOTE_CATALOG.eighth, NOTE_CATALOG.quarter, NOTE_CATALOG.sixteenth]).isCorrect, false);
assert.equal(validateAnswer(expected, [NOTE_CATALOG.quarter]).isCorrect, false);

console.log("Rhythm tests passed.");
