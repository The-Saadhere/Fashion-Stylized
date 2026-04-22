import {Resend} from "resend";
import VerificationEmail from "@/app/components/email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendOTPEmailParams = {
  email: string;
  username: string;
  otp: string;
};

export async function sendOTPEmail({email, username,otp}: SendOTPEmailParams){
    try {
          const { data, error } = await resend.emails.send({
      from: 'Fashion Stylized <noreply@fashionstylized.store>', // change in production
      to: [email],
      subject: 'Your Verification Code',
      react: VerificationEmail({ username, otp }),
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    return data;
    } catch (error) {
        throw new Error('Failed to send email');
    }
}