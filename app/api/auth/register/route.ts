import { NextRequest,NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User"
import { registerSchema } from "@/lib/register-validation/auth";

export async function POST(request: NextRequest){
try {
    const { email, username, password } = await request.json();

    const result = registerSchema.safeParse({ email, username, password });
if (!result.success) {
    return NextResponse.json({ 
        success: false, 
        error: result.error.issues.map(issue => issue.message) 
    }, { status: 400 });
}

const validatedData = result.data;
} catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid input data' }, { status: 400 });
}
}