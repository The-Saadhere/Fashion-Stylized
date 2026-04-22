import { connectToDatabase } from "./db";
import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import User from "@/models/User";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }
                try {
                    await connectToDatabase();
                    const user = await User.findOne({ email: credentials.email });
                    if (!user) {
                        throw new Error("No user found with the provided email");
                    }
                    const isMatch = await compare(credentials.password, user.password);
                    if (!isMatch) {
                        throw new Error("Invalid password");
                    }
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        role: user.role
                    }

                } catch (error) {
                    throw new Error("Invalid email or password");

                }
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        })


    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;         // ✅ user.id exists by default
                token.role = (user as { role?: string }).role; // only cast what isn't typed
            }
            return token;
        },
        async signIn({ user, account, profile }) {
            await connectToDatabase();
            if (account?.provider === "google") {
                const existingUser = await User.findOne({ email: user.email });
                if (existingUser && existingUser.provider === "local") {
                    await User.findOneAndUpdate({
                        email: user.email
                    },
                        {
                            $set: {
                                googleId: profile?.sub,
                                isVerified: true,
                            }
                        }
                    )
                }
                else {
                    await User.findOneAndUpdate(
                        {email: user.email},
                        {
                            $set: {
                                name: user.name,
                                email: user.email,
                                provider: "google",
                                googleId: profile?.sub,
                                isVerified: true
                            }
                        },
                        { upsert: true, new: true}
                    )
                }
                
        

        }
   
    return true;
    }
    ,

    async session({ session, token }) {
        session.user.id = token.id ?? "";
        session.user.role = token.role;
        // name & email are already handled by NextAuth — no need to copy them
        return session;
    },
},
    session: {
        strategy: "jwt",
        maxAge: 10 * 24 * 60 * 60, // 10 days
    }
    ,
pages: {
    signIn: "signIn",
        error: "signIn"
},
secret: process.env.NEXTAUTH_SECRET
}