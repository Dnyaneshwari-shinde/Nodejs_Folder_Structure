import mongoose, {
  Schema,
  type HydratedDocument,
  type Model,
} from "mongoose";

export interface User {
  name: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true },
);
export type UserDocument = HydratedDocument<User>;

const UserModel =
  (mongoose.models.User as Model<User> | undefined) ??
  mongoose.model<User>("User", userSchema);

export default UserModel;
