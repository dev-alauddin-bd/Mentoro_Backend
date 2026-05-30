/**
 * User data interface for system-wide type safety
 * Updated for PostgreSQL/Prisma compatibility (using 'id' instead of '_id')
 */

import { ICompletedLesson, IEnrollment } from "./course.interface";

export enum UserRole {
  STUDENT = "student",
  ADMIN = "admin",
  INSTRUCTOR = "instructor",
}

export enum UserStatus {
  ACTIVE = "active",
  BLOCKED = "blocked",
}





// Assignment submission type
export enum SubmissionType {
  text = "text",
  link = "link",
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  password?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string | null;
  enrolledCourses?: IEnrollment[];
  completedLessons?: ICompletedLesson[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface representing user credentials required for login
 */
export interface IUserLogin {
  email: string;           // Target account email address
  password: string;        // Raw password to be verified against hash
}
