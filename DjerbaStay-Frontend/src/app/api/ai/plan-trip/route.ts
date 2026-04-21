export async function POST(request: Request) {
  void request;
  return Response.json(
    {
      error: "Deprecated endpoint. Use POST /api/planner/generate on Express backend.",
    },
    { status: 410 }
  );
}
