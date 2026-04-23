import {NextRequest, NextResponse} from "next/server"
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { passwordSchema } from "@/lib/register-validation/auth";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({
        success: false,
        error: "userId and newPassword are required",
      }, { status: 400 });
    }
    const passwordValidation = passwordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      return NextResponse.json({
        success: false,
        error: passwordValidation.error.issues.map(issue => issue.message),
      }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found",
      }, { status: 404 });
    }

    // 🔑 key check — did they actually verify the OTP?
    if (!user.passwordResetVerified) {
      return NextResponse.json({
        success: false,
        error: "Please verify your OTP first",
      }, { status: 403 });
    }

    // check OTP window still valid
    // extra security so they cant sit on this for hours
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return NextResponse.json({
        success: false,
        error: "Session expired, please start again",
      }, { status: 410 });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update password and clear everything
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.passwordResetVerified = false; // reset flag
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successfully, you can now login",
    }, { status: 200 });

    
    } catch (error) {
         console.error("Reset password error:", error);
    return NextResponse.json({
      success: false,
      error: "Something went wrong",
    }, { status: 500 });
    }


    
}