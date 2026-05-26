import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import process from "process";
import pg from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting seed...");

  const hashedPassword = await bcrypt.hash("password123", 12);

  // CLEAN
  console.log("🧹 Cleaning DB...");
  await prisma.liveRegistration.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.completedLesson.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // USERS
  console.log("👤 Users...");
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@mentoro.com",
      password: hashedPassword,
      role: "admin",
    },
  });

  await prisma.user.create({
    data: {
      name: "Instructor",
      email: "instructor@mentoro.com",
      password: hashedPassword,
      role: "instructor",
    },
  });

  await prisma.user.create({
    data: {
      name: "Student",
      email: "student@mentoro.com",
      password: hashedPassword,
      role: "student",
    },
  });
  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
