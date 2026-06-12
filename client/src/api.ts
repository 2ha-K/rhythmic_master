import type { GeneratedQuestion, RhythmNote, TimeSignature, ValidateResult } from "./types";

export async function createQuestion(timeSignature: TimeSignature): Promise<GeneratedQuestion> {
  const response = await fetch("/api/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timeSignature })
  });

  if (!response.ok) {
    throw new Error("Could not generate a rhythm question.");
  }

  return response.json();
}

export async function validateAnswer(questionId: string, answer: RhythmNote[]): Promise<ValidateResult> {
  const response = await fetch(`/api/questions/${questionId}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer })
  });

  if (!response.ok) {
    throw new Error("Could not validate the current rhythm.");
  }

  return response.json();
}
