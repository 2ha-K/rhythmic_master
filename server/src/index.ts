import Fastify from "fastify";
import { generateQuestion, isTimeSignature, validateAnswer } from "./rhythm.js";
import type { GeneratedQuestion, RhythmNote } from "./types.js";

const server = Fastify({ logger: true });
const questions = new Map<string, GeneratedQuestion>();

server.get("/api/health", async () => ({ ok: true }));

server.post<{ Body: { timeSignature?: unknown } }>("/api/questions", async (request, reply) => {
  const { timeSignature } = request.body ?? {};

  if (!isTimeSignature(timeSignature)) {
    return reply.code(400).send({
      error: "timeSignature must be one of 4/4, 3/4, or 6/8"
    });
  }

  const question = generateQuestion(timeSignature);
  questions.set(question.questionId, question);
  return question;
});

server.post<{ Params: { questionId: string }; Body: { answer?: RhythmNote[] } }>(
  "/api/questions/:questionId/validate",
  async (request, reply) => {
    const question = questions.get(request.params.questionId);

    if (!question) {
      return reply.code(404).send({ error: "Question not found" });
    }

    const answer = Array.isArray(request.body?.answer) ? request.body.answer : [];
    return validateAnswer(question.rhythm, answer);
  }
);

const port = Number(process.env.PORT ?? 3001);

server.listen({ port, host: "127.0.0.1" }).catch((error) => {
  server.log.error(error);
  process.exit(1);
});
