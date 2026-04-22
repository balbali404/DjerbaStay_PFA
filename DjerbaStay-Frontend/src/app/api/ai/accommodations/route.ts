const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:4000";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/accommodations`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await response.text();
    return new Response(payload, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return Response.json({ error: "Backend is unavailable" }, { status: 502 });
  }
}
