import { NextResponse } from "next/server";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { message: "Email address is required" },
        { status: 400 }
      );
    }
    
    // Create a test email
    const emailContent = await generateEmailBody(
      {
        title: "Test Product",
        url: "https://example.com/test-product",
      },
      "WELCOME"
    );
    
    // Try to send the email
    const result = await sendEmail(emailContent, [email]);
    
    return NextResponse.json({
      message: result.success 
        ? "Test email sent successfully" 
        : "Failed to send test email",
      data: result
    });
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { message: `Error: ${error.message}` },
      { status: 500 }
    );
  }
} 