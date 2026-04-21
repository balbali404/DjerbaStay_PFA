import { proxyAiRequest } from "@/lib/aiProxy";

export async function POST(request: Request) {
  const body = await request.text();
  return proxyAiRequest("/estimate_budget", {
    method: "POST",
    body,
  });
}
