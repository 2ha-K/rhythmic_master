import { randomUUID } from "node:crypto";
export const NOTE_CATALOG = {
    dottedHalf: { type: "dottedHalf", units: 12 },
    half: { type: "half", units: 8 },
    dottedQuarter: { type: "dottedQuarter", units: 6 },
    quarter: { type: "quarter", units: 4 },
    dottedEighth: { type: "dottedEighth", units: 3 },
    eighth: { type: "eighth", units: 2 },
    sixteenth: { type: "sixteenth", units: 1 }
};
export const MEASURE_UNITS = {
    "4/4": 16,
    "3/4": 12,
    "6/8": 12
};
const NOTES = Object.values(NOTE_CATALOG);
export function isTimeSignature(value) {
    return value === "4/4" || value === "3/4" || value === "6/8";
}
export function generateQuestion(timeSignature) {
    const measureUnits = MEASURE_UNITS[timeSignature];
    const measures = [generateMeasure(measureUnits), generateMeasure(measureUnits)];
    const rhythm = measures.flat();
    return {
        questionId: randomUUID(),
        timeSignature,
        measures,
        rhythm,
        accentUnitOffsets: timeSignature === "6/8" ? [0, 6] : [0]
    };
}
export function generateMeasure(measureUnits) {
    const measure = [];
    let remainingUnits = measureUnits;
    while (remainingUnits > 0) {
        const candidates = NOTES.filter((note) => note.units <= remainingUnits);
        const picked = candidates[Math.floor(Math.random() * candidates.length)];
        measure.push({ ...picked });
        remainingUnits -= picked.units;
    }
    return measure;
}
export function validateAnswer(expected, answer) {
    const expectedUnits = sumUnits(expected);
    const currentUnits = sumUnits(answer);
    const isCorrect = expected.length === answer.length &&
        expected.every((note, index) => {
            const candidate = answer[index];
            return candidate?.type === note.type && candidate.units === note.units;
        });
    return {
        isCorrect,
        expectedUnits,
        currentUnits
    };
}
export function sumUnits(notes) {
    return notes.reduce((total, note) => total + note.units, 0);
}
