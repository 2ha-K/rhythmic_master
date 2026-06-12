# Rhythmic Master Agent Guide

## Product Goal

This project is a web-based rhythm training music app.

Users select a time signature, generate a two-measure rhythm question, listen to the rhythm played as a fixed La sound, then drag rhythm notes onto a staff to recreate the answer.

The app focuses on rhythm recognition, not pitch recognition.

## Core User Flow

1. Before generating a question, the user selects exactly one time signature with buttons:
   - 4/4
   - 3/4
   - 6/8

2. Default selected time signature is 4/4.

3. The selected time signature button appears active.

4. The non-selected time signature buttons appear greyed out/inactive, but remain clickable so the user can switch selection before generating a question.

5. The user clicks "Generate Question".

6. The app shows:
   - A full staff with two measures.
   - A reusable note basket containing rhythm notes.
   - A play button.
   - An answer button.
   - A reset/restart button.

7. The user clicks play.
   - A one-measure metronome count-in is played before the rhythm.
   - 4/4 count-in uses four quarter-note clicks.
   - 3/4 count-in uses three quarter-note clicks.
   - 6/8 count-in uses six eighth-note clicks.
   - The rhythm is played using a fixed La sound.
   - The fixed pitch is A4 / La / 440Hz.
   - All displayed notes are placed on the La position on the staff, from bottom to top: the second space.

8. The user drags rhythm notes from the basket onto the staff.
   - Basket notes are reusable and do not decrease.
   - Notes placed on the staff can be dragged left or right.
   - Dragging a placed note over another placed note swaps their order.
   - Dragging a placed note outside the staff and releasing removes it.
   - Notes can only be dropped onto the allowed La rhythm lane.

9. After every drag/drop change, the frontend calls the backend validation service.

10. If the answer rhythm matches the generated answer:
    - Show a pass/success state.
    - Show or enable a restart button.

11. The reset/restart button clears all placed notes.

12. The answer button toggles the correct answer on the staff.
    - Showing the answer does not clear the user's current placed notes.
    - Pressing the answer button again returns to the user's current answer.
    - Drag/drop interaction is paused while the answer key is visible.

## Rhythm Model

Use duration units based on sixteenth notes.

Durations:

- Dotted half note: 12 units
- Half note: 8 units
- Dotted quarter note: 6 units
- Quarter note: 4 units
- Dotted eighth note: 3 units
- Eighth note: 2 units
- Sixteenth note: 1 unit

Measure lengths:

- 4/4: 16 units per measure
- 3/4: 12 units per measure
- 6/8: 12 units per measure

A generated question always contains exactly two measures.

A note may only be generated if it fits inside the remaining units of the current measure. Do not allow notes to cross measure boundaries in v1.

Whole notes are not used in v1.

The notation renderer should use orthodox beat grouping:

- 4/4 and 3/4 use quarter-note beat groups.
- 6/8 uses two dotted-quarter beat groups.
- Notes that cross a beat-group boundary should be visually split and connected with ties.
- Eighth and sixteenth notes inside the same beat group should be beamed together.
- Dotted notes are allowed.

## Frontend Technical Direction

Recommended stack:

- React
- Vite
- TypeScript
- VexFlow for staff and notation rendering
- @dnd-kit for drag and drop
- Tone.js or native Web Audio for realtime playback

Frontend responsibilities:

- Render time signature buttons before question generation.
- Allow only one selected time signature at a time.
- Default to 4/4.
- Grey out non-selected time signature buttons.
- Generate question button.
- Answer button that toggles the correct rhythm on the staff.
- Staff rendering.
- Reusable note basket.
- Drag/drop interaction.
- Playback using the generated rhythm.
- Calling backend validation after every answer change.
- Showing pass/reset states.

Notation rules:

- Render a full staff.
- All notes appear on the La position only.
- Use rhythm values only; pitch is fixed.
- Display two measures.
- Display notes with orthodox beat grouping.
- Split notes that cross beat-group boundaries and connect them with ties.
- Beam eighth and sixteenth notes inside the same beat group.
- Allow dotted notes.

Playback rules:

- First version uses frontend realtime playback.
- Play a metronome count-in before the generated rhythm.
- 4/4 count-in: 4 quarter-note clicks.
- 3/4 count-in: 3 quarter-note clicks.
- 6/8 count-in: 6 eighth-note clicks.
- Use A4 / 440Hz for every note.
- Rhythm duration follows the generated note sequence.
- Rests are not part of v1 unless explicitly added later.

## Backend Technical Direction

Recommended stack:

- Node.js
- TypeScript
- Fastify

No database is required for v1.

Backend services:

### Service 1: Generate Rhythm

Generates a rhythm question.

Input:

- timeSignature: "4/4" | "3/4" | "6/8"

Output:

- questionId
- timeSignature
- measures
- answer rhythm sequence

The generated rhythm must:

- Contain exactly two measures.
- Fully fill each measure.
- Use only supported note durations.
- Respect the selected time signature.
- Avoid crossing measure boundaries.

### Service 2: Audio

For v1, audio playback is handled on the frontend.

Keep this service as a future extension point for generating MP3 files from a rhythm sequence.

### Service 3: Validate Answer

Validates the user's current dragged rhythm answer.

Input:

- questionId
- user rhythm sequence

Output:

- isCorrect: boolean
- expectedLength
- currentLength
- optional mismatch information for debugging

Validation rules:

- Compare rhythm durations in order.
- The answer is correct only when every duration matches the generated answer exactly.
- Pitch is ignored because every note is fixed to La.
- Validation should run after every drag/drop update.

## Suggested API Shape

### POST /api/questions

Request:

```json
{
  "timeSignature": "4/4"
}
```

Response:

```json
{
  "questionId": "string",
  "timeSignature": "4/4",
  "measures": [
    [
      { "type": "quarter", "units": 4 },
      { "type": "eighth", "units": 2 }
    ]
  ],
  "answer": [
    { "type": "quarter", "units": 4 },
    { "type": "eighth", "units": 2 }
  ]
}
```

### POST /api/questions/:questionId/validate

Request:

```json
{
  "answer": [
    { "type": "quarter", "units": 4 },
    { "type": "eighth", "units": 2 }
  ]
}
```

Response:

```json
{
  "isCorrect": false,
  "expectedUnits": 32,
  "currentUnits": 6
}
```

## UI Requirements

The first screen should be the working app, not a landing page.

The UI should include:

- Time signature button group: 4/4, 3/4, 6/8.
- Only one time signature can be selected.
- Default selected button is 4/4.
- Selected button is visually active.
- Non-selected buttons are greyed out/inactive-looking.
- Generate question button.
- Play button.
- Answer button.
- Reset/restart button.
- Two-measure staff.
- Reusable note basket.
- Pass/success state.

## Test Scenarios

Frontend:

- Default time signature is 4/4.
- Only one time signature button can be selected at a time.
- Non-selected time signature buttons appear greyed out.
- Clicking 3/4 or 6/8 updates the selected state before generation.
- Generate question sends the selected time signature.
- Generate question renders a two-measure staff.
- Basket notes remain available after dragging.
- Dragging a note onto the staff adds it.
- Dragging a placed note outside the staff removes it.
- Dragging notes left/right swaps their order.
- Reset clears all placed notes.
- Correct answer shows pass state.
- Play button plays a metronome count-in, then the rhythm using fixed La.
- Answer button shows the correct answer without clearing the user's current work.

Backend:

- 4/4 generation creates two measures of 16 units each.
- 3/4 generation creates two measures of 12 units each.
- 6/8 generation creates two measures of 12 units each.
- Generated notes never exceed measure length.
- Whole notes are not generated in 3/4 or 6/8.
- Validation returns true only for an exact duration sequence match.
- Validation ignores pitch.

## Current Assumptions

- First version uses frontend realtime audio instead of backend MP3 generation.
- Pitch is always A4 / La / 440Hz.
- Notes do not cross measure boundaries.
- Rests are not included in v1.
- No login, persistence, user accounts, or database are needed.
