import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createQuestion, validateAnswer } from "./api";
import {
  canSequenceFit,
  makePlacedNote,
  MEASURE_UNITS,
  NOTE_CATALOG,
  NOTE_LABELS,
  playQuestion,
  totalUnits
} from "./music";
import { StaffNotation } from "./StaffNotation";
import type { GeneratedQuestion, NoteType, PlacedNote, RhythmNote, TimeSignature, ValidateResult } from "./types";
import "./styles.css";

const TIME_SIGNATURES: TimeSignature[] = ["4/4", "3/4", "6/8"];

export default function App() {
  const [timeSignature, setTimeSignature] = useState<TimeSignature>("4/4");
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [answer, setAnswer] = useState<PlacedNote[]>([]);
  const [validation, setValidation] = useState<ValidateResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [showAnswer, setShowAnswer] = useState(false);
  const [message, setMessage] = useState("Choose a meter, generate a rhythm, then build what you hear.");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const targetUnits = question ? MEASURE_UNITS[question.timeSignature] * 2 : MEASURE_UNITS[timeSignature] * 2;
  const currentUnits = totalUnits(answer);
  const progress = Math.min(100, (currentUnits / targetUnits) * 100);
  const isCorrect = validation?.isCorrect ?? false;
  const displayedNotes = showAnswer && question ? question.rhythm : answer;

  useEffect(() => {
    if (!question) {
      setValidation(null);
      return;
    }

    let cancelled = false;
    validateAnswer(question.questionId, answer).then((result) => {
      if (!cancelled) {
        setValidation(result);
      }
    }).catch(() => {
      if (!cancelled) {
        setMessage("Validation is temporarily unavailable.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [answer, question]);

  async function handleGenerate() {
    setStatus("loading");
    setMessage("Generating a two-measure rhythm.");
    setAnswer([]);
    setValidation(null);
    setShowAnswer(false);

    try {
      const nextQuestion = await createQuestion(timeSignature);
      setQuestion(nextQuestion);
      setStatus("ready");
      setMessage("Listen, then drag notes into the La line.");
    } catch {
      setStatus("error");
      setMessage("Could not reach the rhythm server.");
    }
  }

  function handleReset() {
    setAnswer([]);
    setValidation(null);
    setShowAnswer(false);
    setMessage(question ? "Answer cleared. Try the rhythm again." : "Choose a meter, generate a rhythm, then build what you hear.");
  }

  function handleToggleAnswer() {
    if (!question) {
      return;
    }

    setShowAnswer((current) => !current);
    setMessage(showAnswer ? "Answer hidden. Keep building what you hear." : "Showing the correct rhythm.");
  }

  function handlePlay() {
    if (!question) {
      return;
    }

    playQuestion(question);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeSource = active.data.current?.source as "basket" | "answer" | undefined;

    if (!question || !activeSource || showAnswer) {
      return;
    }

    if (activeSource === "basket") {
      const note = active.data.current?.note as RhythmNote | undefined;
      if (!note || !over) {
        return;
      }

      const overId = String(over.id);
      const next = [...answer];
      const insertIndex = overId.startsWith("placed-")
        ? Math.max(0, answer.findIndex((placed) => placed.id === overId.replace("placed-", "")))
        : answer.length;

      next.splice(insertIndex === -1 ? answer.length : insertIndex, 0, makePlacedNote(note));

      if (canSequenceFit(next, question.timeSignature)) {
        setAnswer(next);
      } else {
        setMessage("That note would cross the bar line. Try a shorter value.");
      }
      return;
    }

    const activeId = String(active.id).replace("placed-", "");

    if (!over) {
      setAnswer((current) => current.filter((note) => note.id !== activeId));
      return;
    }

    const overId = String(over.id).replace("placed-", "");
    const oldIndex = answer.findIndex((note) => note.id === activeId);
    const newIndex = answer.findIndex((note) => note.id === overId);

    if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
      const moved = arrayMove(answer, oldIndex, newIndex);
      if (canSequenceFit(moved, question.timeSignature)) {
        setAnswer(moved);
      } else {
        setMessage("That swap would break the measure boundary.");
      }
    }
  }

  const answerIds = useMemo(() => answer.map((note) => `placed-${note.id}`), [answer]);

  return (
    <main className="app-shell">
      <section className="control-band" aria-label="Rhythm controls">
        <div className="brand-block">
          <p className="eyebrow">Rhythmic Master</p>
          <h1>Build the rhythm you hear.</h1>
        </div>

        <div className="meter-panel" aria-label="Time signature selector">
          {TIME_SIGNATURES.map((signature) => (
            <button
              className={`meter-button ${timeSignature === signature ? "is-active" : ""}`}
              key={signature}
              type="button"
              onClick={() => setTimeSignature(signature)}
              aria-pressed={timeSignature === signature}
            >
              {signature}
            </button>
          ))}
        </div>

        <div className="action-row">
          <button className="primary-action" type="button" onClick={handleGenerate} disabled={status === "loading"}>
            {status === "loading" ? "Generating" : "Generate Question"}
          </button>
          <button className="icon-action" type="button" onClick={handlePlay} disabled={!question} title="Play rhythm" aria-label="Play rhythm">
            Play
          </button>
          <button
            className={`icon-action ${showAnswer ? "is-active" : ""}`}
            type="button"
            onClick={handleToggleAnswer}
            disabled={!question}
            title={showAnswer ? "Hide answer" : "Show answer"}
            aria-label={showAnswer ? "Hide answer" : "Show answer"}
            aria-pressed={showAnswer}
          >
            {showAnswer ? "Hide" : "Answer"}
          </button>
          <button className="icon-action" type="button" onClick={handleReset} title="Reset answer" aria-label="Reset answer">
            Reset
          </button>
        </div>
      </section>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <section className={`practice-floor ${isCorrect ? "is-passed" : ""}`} aria-label="Practice area">
          <div className="staff-header">
            <div>
              <p className="eyebrow">Staff lane</p>
              <h2>
                {question
                  ? `${question.timeSignature} ${showAnswer ? "answer key" : "rhythm challenge"}`
                  : "Generate a question to begin"}
              </h2>
            </div>
            <div className="unit-meter" aria-label="Answer unit progress">
              <span>{currentUnits}</span>
              <div className="meter-track">
                <i style={{ width: `${progress}%` }} />
              </div>
              <span>{targetUnits}</span>
            </div>
          </div>

          <StaffDropArea answerIds={answerIds} showingAnswer={showAnswer}>
            <StaffNotation notes={displayedNotes} timeSignature={question?.timeSignature ?? timeSignature} />
            {!showAnswer ? (
              <div className="la-lane" aria-label="La rhythm lane">
                {answer.length === 0 ? (
                  <span className="lane-placeholder">Drop notes on the La lane</span>
                ) : (
                  <SortableContext items={answerIds}>
                    {answer.map((note) => (
                      <PlacedNoteChip key={note.id} note={note} />
                    ))}
                  </SortableContext>
                )}
              </div>
            ) : null}
          </StaffDropArea>

          <div className="feedback-row">
            <p>{isCorrect ? "Passed. The rhythm matches exactly." : message}</p>
            {isCorrect ? (
              <button className="primary-action compact" type="button" onClick={handleReset}>
                Restart
              </button>
            ) : null}
          </div>
        </section>

        <section className="basket-band" aria-label="Reusable rhythm note basket">
          <div>
            <p className="eyebrow">Reusable note basket</p>
            <h2>Drag any value. The basket never runs out.</h2>
          </div>
          <div className="basket-grid">
            {NOTE_CATALOG.map((note) => (
              <BasketNote key={note.type} note={note} />
            ))}
          </div>
        </section>
      </DndContext>
    </main>
  );
}

function StaffDropArea({
  children,
  showingAnswer
}: {
  children: React.ReactNode;
  answerIds: string[];
  showingAnswer: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: "staff-drop",
    data: { source: "staff" }
  });

  return (
    <div className={`staff-zone ${isOver ? "is-over" : ""} ${showingAnswer ? "is-showing-answer" : ""}`} ref={setNodeRef}>
      {children}
    </div>
  );
}

function BasketNote({ note }: { note: RhythmNote }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `basket-${note.type}`,
    data: { source: "basket", note }
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      className={`note-tile ${isDragging ? "is-dragging" : ""}`}
      style={style}
      type="button"
      {...listeners}
      {...attributes}
    >
      <NoteGlyph type={note.type} />
      <span className="sr-only">{NOTE_LABELS[note.type]}</span>
    </button>
  );
}

function PlacedNoteChip({ note }: { note: PlacedNote }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `placed-${note.id}`,
    data: { source: "answer", note }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <button
      ref={setNodeRef}
      className={`placed-note ${isDragging ? "is-dragging" : ""}`}
      style={style}
      type="button"
      {...attributes}
      {...listeners}
    >
      <span className="sr-only">{NOTE_LABELS[note.type]}</span>
    </button>
  );
}

function NoteGlyph({ type, compact = false }: { type: NoteType; compact?: boolean }) {
  const flags = type === "sixteenth" ? 2 : type === "eighth" || type === "dottedEighth" ? 1 : 0;
  const isHalf = type === "half" || type === "dottedHalf";
  const isDotted = type === "dottedHalf" || type === "dottedQuarter" || type === "dottedEighth";
  const strokeWidth = compact ? 5 : 4;

  return (
    <svg
      className={`note-glyph ${compact ? "is-compact" : ""}`}
      viewBox="0 0 96 120"
      role="img"
      aria-label={NOTE_LABELS[type]}
    >
      <ellipse
        className={isHalf ? "note-head is-open" : "note-head"}
        cx="34"
        cy="86"
        rx="21"
        ry="14"
        transform="rotate(-22 34 86)"
      />
      <path className="note-stem" d="M52 82 V18" strokeWidth={strokeWidth} />
      {flags >= 1 ? <path className="note-flag" d="M52 18 C76 24 82 42 62 52" strokeWidth={strokeWidth} /> : null}
      {flags >= 2 ? <path className="note-flag" d="M52 36 C74 42 79 58 61 68" strokeWidth={strokeWidth} /> : null}
      {isDotted ? <circle className="note-dot" cx="70" cy="82" r="5" /> : null}
    </svg>
  );
}
