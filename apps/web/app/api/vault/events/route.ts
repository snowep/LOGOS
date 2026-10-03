import { NextRequest, NextResponse } from "next/server";
import { apiBase } from "@/server/apiBase";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${apiBase()}/events/vault`, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Preserve streaming behavior - return the stream directly
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to connect to SSE:", error);
    return NextResponse.json(
      { error: "Failed to connect to vault events" },
      { status: 500 }
    );
  }
}