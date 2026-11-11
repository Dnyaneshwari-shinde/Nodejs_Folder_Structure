export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface UserRecord extends User {
  passwordHash: string;
}