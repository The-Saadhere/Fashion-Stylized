import { NextRequest,NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User"
import { registerSchema } from "@/lib/register-validation/auth";
import {sendOTPEmail} from "@/lib/resend"

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


   // Step 2: connect to DB
    await connectToDatabase();

    // Step 3: check if email already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: "Email already in use",
      }, { status: 409 });
    }

     // Step 4: hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Step 5: generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Step 6: create user

    const newUser = new User({
        email: validatedData.email,
        name: validatedData.username,
        password: hashedPassword,
        otp: otp,
        otpExpiry: otpExpiry,
        isVerified: false,
        
    });
   const savedUser = await newUser.save();

    // Step 7: send OTP email

    await sendOTPEmail({email: validatedData.email, username: validatedData.username, otp});


     return NextResponse.json({
      success: true,
      message: "Account created. Please verify your email.",
      userId: savedUser._id,
    }, { status: 201 });


} catch (error) {
    return NextResponse.json({ success: false, error: "An error occurred while creating the account" }, { status: 400 });
}
}