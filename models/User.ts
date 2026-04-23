import mongoose from "mongoose";

export interface IUser {
    name: string;
    email: string;
    password?: string | null; // Password can be null for users authenticated via Google
    role?: 'user' | 'admin';
    isVerified?: boolean; // For email verification
    otp?: string | null; // For password reset or email verification
    otpExpiry?: Date | null; // Expiry time for OTP
    passwordResetVerified?: boolean; // To track if password reset OTP is verified
    provider?: 'local' | 'google';      // Track auth provider
    googleId?: string;                  
    orders?: [string];
    _id?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date; 
}

const userSchema = new mongoose.Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, unique: true, sparse: true, required: false },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    passwordResetVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    password: { type: String, required: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    orders: [{ type: String }]
}, { timestamps: true
})

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;