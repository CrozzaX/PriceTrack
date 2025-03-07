import { NextResponse } from "next/server";
import { testEnvVariables } from "@/lib/test-env";

export async function GET() {
  try {
    const envStatus = await testEnvVariables();
    
    return NextResponse.json({ 
      message: "Environment variables status", 
      data: envStatus 
    });
  } catch (error: any) {
    console.error("Error testing environment variables:", error);
    return NextResponse.json(
      { message: `Error: ${error.message}` }, 
      { status: 500 }
    );
  }
} 