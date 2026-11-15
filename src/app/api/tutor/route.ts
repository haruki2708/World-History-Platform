import { handleTutorPost } from "@/server/tutor/handler";

/**
 * Seconds a deep answer may take, thinking included. Read by the deployment
 * platform; a local server has no limit.
 */
export const maxDuration = 300;

/** The AI tutor endpoint. All logic lives in src/server/tutor. */
export async function POST(request: Request): Promise<Response> {
  return handleTutorPost(request);
}
