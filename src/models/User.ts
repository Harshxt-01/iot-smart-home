import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    homeLocation: { type: String, trim: true, maxlength: 80, default: "" },
    password: { type: String, required: true, select: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false }
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordTokenHash;
    delete ret.resetPasswordExpires;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("User", userSchema);
