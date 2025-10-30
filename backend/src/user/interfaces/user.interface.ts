import { UserRole } from '../entities/user.entity';

export interface IUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithTokens extends IUser {
  accessToken?: string;
  refreshToken?: string;
}

export interface IJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface IAuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}