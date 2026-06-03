import { ICourse } from "./course.interface";

export interface ICategory {
  id?: string;
  name: string;
  slug: string;
  courses?: ICourse[];
  createdAt?: Date;
  isActive?: boolean;
  updatedAt?: Date;
}