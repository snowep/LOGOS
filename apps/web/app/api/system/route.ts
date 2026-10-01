import { NextRequest, NextResponse } from "next/server";
import { apiBase } from "@/server/apiBase";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${apiBase()}/api/system`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch system data:", error);
    return NextResponse.json(
      { error: "Failed to fetch system data" },
      { status: 500 }
    );
  }
}