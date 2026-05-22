import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import process from "process";
import pg from "pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting comprehensive database seed...");

  const hashedPassword = await bcrypt.hash("password123", 12);

  // 1. CLEANUP (Optional - uncomment if you want a fresh start every time)
  // console.log("🧹 Cleaning up database...");
  // await prisma.legalDocument.deleteMany();
  // await prisma.newsletterSubscriber.deleteMany();
  // await prisma.jobApplication.deleteMany();
  // await prisma.job.deleteMany();
  // await prisma.liveRegistration.deleteMany();
  // await prisma.liveSession.deleteMany();
  // await prisma.assignmentSubmission.deleteMany();
  // await prisma.payment.deleteMany();
  // await prisma.completedLesson.deleteMany();
  // await prisma.enrollment.deleteMany();
  // await prisma.review.deleteMany();
  // await prisma.assignment.deleteMany();
  // await prisma.lesson.deleteMany();
  // await prisma.module.deleteMany();
  // await prisma.course.deleteMany();
  // await prisma.category.deleteMany();
  // await prisma.user.deleteMany();

  // 2. USERS
  console.log("👤 Seeding users...");
  const admin = await prisma.user.upsert({
    where: { email: "admin@mentoro.com" },
    update: {},
    create: { name: "Mentoro Admin", email: "admin@mentoro.com", password: hashedPassword, role: "admin" },
  });

  const instructor1 = await prisma.user.upsert({
    where: { email: "instructor1@mentoro.com" },
    update: {},
    create: { name: "Dr. Alex Smith", email: "instructor1@mentoro.com", password: hashedPassword, role: "instructor" },
  });

  const instructor2 = await prisma.user.upsert({
    where: { email: "instructor2@mentoro.com" },
    update: {},
    create: { name: "Sarah Johnson", email: "instructor2@mentoro.com", password: hashedPassword, role: "instructor" },
  });

  const student1 = await prisma.user.upsert({
    where: { email: "student1@mentoro.com" },
    update: {},
    create: { name: "Alice Cooper", email: "student1@mentoro.com", password: hashedPassword, role: "student" },
  });

  const student2 = await prisma.user.upsert({
    where: { email: "student2@mentoro.com" },
    update: {},
    create: { name: "Bob Martin", email: "student2@mentoro.com", password: hashedPassword, role: "student" },
  });

  // 3. CATEGORIES
  console.log("📁 Seeding categories...");
  const categoryNames = [
    "Web Development", "Mobile App Development", "UI/UX Design", "Data Science", 
    "Cyber Security", "Cloud Computing", "Digital Marketing", "Artificial Intelligence",
    "Game Development", "Blockchain Development"
  ];
  const categories = [];
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories.push(cat);
  }

  // 4. LEGAL DOCUMENTS
  console.log("⚖️ Seeding legal documents...");
  const legalDocs = [
    { slug: "terms-and-conditions", title: "Terms & Conditions", content: "<h1>Terms</h1><p>Rules for using Mentoro...</p>" },
    { slug: "privacy-policy", title: "Privacy Policy", content: "<h1>Privacy</h1><p>How we protect your data...</p>" },
    { slug: "refund-policy", title: "Refund Policy", content: "<h1>Refunds</h1><p>Our 30-day guarantee...</p>" },
  ];
  for (const doc of legalDocs) {
    await prisma.legalDocument.upsert({ where: { slug: doc.slug }, update: doc, create: doc });
  }

  // 5. JOBS
  console.log("💼 Seeding jobs...");
  const jobNames = ["Senior React Developer", "Node.js Architect", "UI/UX Designer", "Data Scientist", "DevOps Engineer"];
  for (const title of jobNames) {
    await prisma.job.create({
      data: {
        title,
        category: "Engineering",
        location: "Remote",
        type: "Full-time",
        salary: "$100k - $150k",
        description: `Exciting opportunity for a ${title}...`,
        isPublished: true,
      }
    });
  }

  // 6. LIVE SESSIONS
  console.log("🎥 Seeding live sessions...");
  await prisma.liveSession.create({
    data: {
      title: "Mastering Next.js Server Actions",
      description: "Live workshop on the latest Next.js features.",
      sessionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      maxCapacity: 100,
      meetingLink: "https://zoom.us/j/123456789",
      isPublished: true,
    }
  });

  // 7. COURSES & MODULES & LESSONS
  console.log("📚 Seeding 20 courses...");
  // const courses = [
  //   { title: "React Mastery", cat: 0, price: 49.99 },
  //   { title: "Advanced Node.js", cat: 0, price: 59.99 },
  //   { title: "Figma for Pros", cat: 2, price: 39.99 },
  //   { title: "Python Data Science", cat: 3, price: 69.99 },
  //   { title: "Ethical Hacking", cat: 4, price: 89.99 },
  //   { title: "AWS Architecture", cat: 5, price: 99.99 },
  //   { title: "SEO Fundamentals", cat: 6, price: 29.99 },
  //   { title: "Intro to AI", cat: 7, price: 119.99 },
  //   { title: "Unity 3D Games", cat: 8, price: 79.99 },
  //   { title: "Blockchain Basics", cat: 9, price: 129.99 },
  //   { title: "Vue.js Guide", cat: 0, price: 44.99 },
  //   { title: "Docker for Devs", cat: 5, price: 54.99 },
  //   { title: "TypeScript Deep Dive", cat: 0, price: 49.99 },
  //   { title: "Flutter Essentials", cat: 1, price: 74.99 },
  //   { title: "Adobe XD Masterclass", cat: 2, price: 34.99 },
  //   { title: "Kubernetes in Practice", cat: 5, price: 104.99 },
  //   { title: "Machine Learning with R", cat: 3, price: 94.99 },
  //   { title: "Cyber Defense 101", cat: 4, price: 84.99 },
  //   { title: "SwiftUI Apps", cat: 1, price: 79.99 },
  //   { title: "Go Backend Dev", cat: 0, price: 64.99 },
  // ];

  // for (const c of courses) {
  //   const course = await prisma.course.create({
  //     data: {
  //       title: c.title,
  //       description: `A complete guide to ${c.title}.`,
  //       thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
  //       previewVideo: "https://youtube.com/watch?v=sample",
  //       price: c.price,
  //       instructorId: instructor1.id,
  //       categoryId: categories[c.cat]!.id,
  //       isPublished: true,
  //     }
  //   });

  //   const m = await prisma.module.create({
  //     data: { title: "Module 1: Getting Started", order: 1, courseId: course.id }
  //   });

  //   const l = await prisma.lesson.create({
  //     data: { title: "Introduction", videoUrl: "https://youtube.com/watch?v=intro", duration: 10, moduleId: m.id, order: 1 }
  //   });

  //   // Randomly enroll student 1 in some courses
  //   if (Math.random() > 0.5) {
  //     await prisma.enrollment.create({ data: { userId: student1.id, courseId: course.id } });
  //     await prisma.payment.create({
  //       data: {
  //         amount: c.price,
  //         currency: "usd",
  //         status: "COMPLETED",
  //         type: "COURSE_PURCHASE",
  //         userId: student1.id,
  //         courseId: course.id,
  //         stripePaymentId: `pi_${Math.random().toString(36).substring(7)}`,
  //       }
  //     });
  //     await prisma.completedLesson.create({ data: { userId: student1.id, lessonId: l.id } });
  //   }
  // }


  // 8. NEWSLETTER
  console.log("📧 Seeding newsletter...");
  await prisma.newsletterSubscriber.upsert({
    where: { email: "hello@mentoro.com" },
    update: {},
    create: { email: "hello@mentoro.com" }
  });

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
