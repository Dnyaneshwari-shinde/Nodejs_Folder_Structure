// Execute database queries for users

import UserModel, { type UserDocument } from "../models/user.model.js";

export interface NewUser {
  name: string;
  email: string;
  password: string;
}

export interface UserRepository {
  findByEmail(email: string, includePassword?: boolean): Promise<UserDocument | null>;
  create(user: NewUser): Promise<UserDocument>;
}

const userRepository: UserRepository = {
  findByEmail(email, includePassword = false) {
    const query = UserModel.findOne({ email });
    if (includePassword) {
      query.select("+password");
    }
    return query.exec();
  },

  create(user) {
    return UserModel.create(user);
  },
};

export default userRepository;
