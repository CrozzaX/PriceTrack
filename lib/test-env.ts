"use server"

export async function testEnvVariables() {
  return {
    emailUserExists: !!process.env.EMAIL_USER,
    emailPasswordExists: !!process.env.EMAIL_PASSWORD,
    emailUser: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '...' : null,
    // Only return the first character of the password for security
    emailPasswordLength: process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0
  };
} 