import { NextRequest, NextResponse } from "next/server";
import { apiBase } from "@/server/apiBase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${apiBase()}/api/documents${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Preserve the upstream status code instead of turning everything into 500
    if (!response.ok) {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}