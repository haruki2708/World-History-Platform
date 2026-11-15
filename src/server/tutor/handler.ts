import "server-only";
import { streamClaudeAnswer } from "./claude";
import { hasApiKey, isMockMode } from "./config";
import { streamMockAnswer } from "./mock";
import { errorResponse, streamResponse } from "./respond";
import { readTutorRequest } from "./validate";

/**
 * POST /api/tutor: validates the question and its context, then streams the
 * answer as NDJSON (see TutorStreamEvent in src/lib/tutor.ts).
 */
export async function handleTutorPost(request: Request): Promise<Response> {
  const parsed = await readTutorRequest(request);
  if (!parsed.ok) {
    console.warn(`[tutor] bad request: ${parsed.reason}`);
    return errorResponse("bad_request");
  }

  // Aborted when the browser disconnects, which cancels the upstream call.
  const abort = new AbortController();
  if (request.signal.aborted) abort.abort();
  else request.signal.addEventListener("abort", () => abort.abort());

  if (isMockMode()) {
    return streamResponse(streamMockAnswer(parsed.request, abort.signal), abort);
  }
  if (!hasApiKey()) {
    console.warn(
      "[tutor] ANTHROPIC_API_KEY is not set and TUTOR_MOCK is not 1; see .env.example",
    );
    return errorResponse("not_configured");
  }
  return streamResponse(streamClaudeAnswer(parsed.request, abort.signal), abort);
}
