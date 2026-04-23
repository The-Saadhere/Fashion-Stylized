import {NextResponse, NextRequest} from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { sendOTPEmail } from "@/lib/resend";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({
                success: false,
                error: "Email is required"
            }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findOne({ email });
         if (!user) {
      return NextResponse.json({
        success: true,
        message: "If this email exists you will receive an OTP",
      }, { status: 200 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.passwordResetVerified = false; // reset this every time
    await user.save();

    await sendOTPEmail({
      email: user.email,
      username: user.username,
      otp,
    });

        return NextResponse.json({
      success: true,
      message: "If this email exists you will receive an OTP",
      userId: user._id, // send this to frontend
    }, { status: 200 });

    } catch (error) {
         console.error("Forgot password error:", error);
        return NextResponse.json({
            success: false,
            error: "An error occurred while processing your request",
        }, { status: 500 })
    }
}