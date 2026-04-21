import { proxyAiRequest } from "@/lib/aiProxy";

export async function GET() {
  return proxyAiRequest("/accommodations", { method: "GET" });
}
