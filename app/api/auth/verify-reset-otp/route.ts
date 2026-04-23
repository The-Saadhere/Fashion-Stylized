import {NextResponse, NextRequest} from "next/server";
import {connectToDatabase} from "@/lib/db";
import User from "@/models/User";

export async function POST(request: NextRequest) {
    try {
        const { userId, otp } = await request.json();
        if (!userId || !otp) {
             return NextResponse.json({
        success: false,
        error: "userId and otp are required",
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

    // check expired
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return NextResponse.json({
        success: false,
        error: "OTP has expired, please request a new one",
      }, { status: 410 });
    }

    // check match
    if (user.otp !== otp) {
      return NextResponse.json({
        success: false,
        error: "Invalid OTP",
      }, { status: 400 });
    }

    // OTP is correct — mark as verified for password reset
    // but do NOT clear OTP yet, clear it in reset-password
    user.passwordResetVerified = true;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "OTP verified, you can now reset your password",
      userId: user._id,
    }, { status: 200 });
    
    } catch (error) {
        console.error("Verify reset OTP error:", error);
        return NextResponse.json({
            success: false,
            error: "An error occurred while processing your request",
        }, { status: 500 })
    }
}