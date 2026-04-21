const AI_BACKEND_URL = process.env.AI_BACKEND_URL || "http://127.0.0.1:5000";

export async function proxyAiRequest(
  path: string,
  init?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(`${AI_BACKEND_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });

    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reach AI backend";
    return Response.json(
      { error: message },
      { status: 502 }
    );
  }
}
