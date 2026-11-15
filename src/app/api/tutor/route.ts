import { handleTutorPost } from "@/server/tutor/handler";

/** The AI tutor endpoint. All logic lives in src/server/tutor. */
export async function POST(request: Request): Promise<Response> {
  return handleTutorPost(request);
}
