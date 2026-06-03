export interface LiveSession {
  title: string;
  description: string;
  thumbnail?: string;
  thumbnailFile?: File;
  sessionDate: string;
  sessionTime: string;
  registrationDeadlineDate: string;
  registrationDeadlineTime: string;
  maxCapacity?: number;
  meetingLink?: string;
  isPublished: boolean;
  // …additional optional arrays
}
