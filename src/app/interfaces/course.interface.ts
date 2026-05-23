// src/interfaces/course.interface.ts


import { ICategory } from "./category.interface";
import { IUser } from "./user.interface";

export interface ICourse {
  id: string;
  title: string;
  description?: string | null;
  thumbnail: string;
  previewVideo: string;
  price: number;
  instructorId: string;
  instructor?: IUser;
  isPublished: boolean;

  categoryId: string;


  category?: ICategory;
  modules?: IModule[];
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    enrolledUsers: number;
  }

  // New fields added for richer course metadata
  learningOutcomes?: string[];
  requirements?: string[];
  targetAudience?: string[];
  tags?: string[];
  hasCertificate?: boolean;
  isFree?: boolean;

}

export interface IModule {
  id: string;
  title: string;
  courseId: string;
  course?: ICourse;
  lessons?: ILesson[];
  order: number;
}


export interface IAssignment {
  id: string;
  description: string;
  lessonId: string;
  lesson?: ILesson;
}

export interface IEnrollment {
  id: string;
  userId: string;
  user?: IUser;
  courseId: string;
  course?: ICourse;
  enrolledAt: string | Date;
  lastActivity: string | Date;
}

export interface ICompletedLesson {
  id: string;
  userId: string;
  user?: IUser;
  lessonId: string;
  lesson?: ILesson;
  completedAt: string | Date;
}

export interface ILesson {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  moduleId: string;
  module?: IModule;
  assignment?: IAssignment | null;
  order: number;
  completedByUsers?: ICompletedLesson[];
}

// Result of getMyCourses in backend
export interface IMyCourse {
  id: string;
  title: string;
  thumbnail: string;
  instructor: string | null;
  totalLessons: number;
  completedLessonsCount: number;
  progressPercentage: number;
  lastActivity: string | Date;
}

// Wrapper type for API response aligned with backend/src/app/utils/sendResponse.ts
export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


