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

  // ---------------------------------------------------------------
  // 1️⃣  Hashed password (shared for all demo users)
  // ---------------------------------------------------------------
  const hashedPassword = await bcrypt.hash("password123", 12);

  // ---------------------------------------------------------------
  // 2️⃣  Clean all tables
  // ---------------------------------------------------------------
  console.log("🧹 Cleaning DB...");
  await prisma.liveRegistration.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ---------------------------------------------------------------
  // 3️⃣  Users
  // ---------------------------------------------------------------
  console.log("👤 Creating users...");
  await prisma.user.createMany({
    data: [
      { name: "Admin", email: "admin@mentoro.com", password: hashedPassword, role: "admin" },
      { name: "Instructor", email: "instructor@mentoro.com", password: hashedPassword, role: "instructor" },
      { name: "Student", email: "student@mentoro.com", password: hashedPassword, role: "student" },
    ],
  });

  // ---------------------------------------------------------------
  // 4️⃣  Categories
  // ---------------------------------------------------------------
  const categories = [
    { name: "Web Development", slug: "web-development" },
    { name: "Mobile Development", slug: "mobile-development" },
    { name: "Data Science", slug: "data-science" },
    { name: "Machine Learning", slug: "machine-learning" },
    { name: "AI", slug: "ai" },
    { name: "Blockchain", slug: "blockchain" },
    { name: "Cloud Computing", slug: "cloud-computing" },
    { name: "Cybersecurity", slug: "cybersecurity" },
    { name: "UI/UX Design", slug: "ui-ux-design" },
    { name: "Digital Marketing", slug: "digital-marketing" },
  ];
  console.log("🌱 Inserting categories...");
  await prisma.category.createMany({ data: categories });

  // ---------------------------------------------------------------
  // 5️⃣  Helper to fetch required foreign ids
  // ---------------------------------------------------------------
  const dbCategories = await prisma.category.findMany();
  const web = dbCategories.find((c) => c.slug === "web-development");
  const mobile = dbCategories.find((c) => c.slug === "mobile-development");
  const data = dbCategories.find((c) => c.slug === "data-science");
  const ml = dbCategories.find((c) => c.slug === "machine-learning");
  const cyber = dbCategories.find((c) => c.slug === "cybersecurity");

  const instructor = await prisma.user.findFirst({ where: { role: "instructor" } });

  if (!web || !mobile || !data || !ml || !cyber || !instructor) {
    throw new Error("❌ Missing required category or instructor");
  }

  // ---------------------------------------------------------------
  // 6️⃣  Courses (your original definitions – unchanged)
  // ---------------------------------------------------------------
  const courses = [
    {
      title: "Full Stack Web Development Bootcamp: React, Next.js, Node.js & PostgreSQL",
      slug: "full-stack-web-development-bootcamp",
      description:
        "Comprehensive full‑stack bootcamp covering React, Next.js, TypeScript, Node.js, Express, PostgreSQL and Prisma. Build SaaS‑grade projects from start to finish.",
      thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
      previewVideo: "https://example.com/videos/fullstack.mp4",
      price: 49.99,
      isPublished: true,
      isDeleted: false,
      hasCertificate: true,
      learningOutcomes: [
        "Build production‑ready full‑stack apps",
        "Design and implement scalable REST APIs",
        "Deploy apps on Vercel / Render",
        "Write clean, testable TypeScript code",
        "Integrate authentication with JWT",
      ],
      requirements: ["Basic HTML/CSS/JS", "Problem‑solving mindset", "Computer with internet access"],
      tags: ["fullstack", "react", "nextjs", "nodejs", "postgresql", "prisma"],
      targetAudience: [
        "Beginners aiming to become professional full‑stack devs",
        "Frontend devs transitioning to backend",
        "Students preparing for junior dev interviews",
      ],
      categoryId: web.id,
      instructorId: instructor.id,
    },
    {
      title: "Frontend Engineering Masterclass with React, Next.js & TypeScript",
      slug: "frontend-engineering-masterclass-react-nextjs-typescript",
      description:
        "Deep dive into high‑performance, scalable front‑end architecture with React, Next.js, TypeScript and Tailwind CSS.",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
      previewVideo: "https://example.com/videos/frontend.mp4",
      price: 39.99,
      isPublished: true,
      isDeleted: false,
      hasCertificate: true,
      learningOutcomes: [
        "Build scalable React apps",
        "Master TypeScript for large codebases",
        "Optimize rendering performance",
        "Implement reusable component systems",
        "Create responsive UI with Tailwind",
      ],
      requirements: ["Basic JavaScript knowledge", "HTML/CSS fundamentals", "Familiarity with React is a plus"],
      tags: ["frontend", "react", "nextjs", "typescript", "ui", "tailwind"],
      targetAudience: [
        "Frontend engineers targeting senior roles",
        "Developers moving from HTML/CSS to React",
        "UI developers building production‑grade apps",
      ],
      categoryId: web.id,
      instructorId: instructor.id,
    },
    {
      title: "Backend Development Mastery with Node.js, Express & PostgreSQL",
      slug: "backend-development-mastery-nodejs-express-postgresql",
      description:
        "Design and build secure, scalable server‑side applications with Node.js, Express and PostgreSQL.",
      thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c",
      previewVideo: "https://example.com/videos/backend.mp4",
      price: 44.99,
      isPublished: true,
      isDeleted: false,
      hasCertificate: true,
      learningOutcomes: [
        "Design scalable backend architecture",
        "Build secure REST APIs",
        "Work with PostgreSQL & Prisma",
        "Implement middleware, logging & error handling",
        "Deploy backend services to production",
      ],
      requirements: ["Basic JavaScript knowledge", "Understanding of HTTP & APIs", "Problem‑solving skills"],
      tags: ["backend", "nodejs", "express", "postgresql", "api"],
      targetAudience: [
        "Aspiring backend developers",
        "Full‑stack devs improving backend skills",
        "Students preparing for backend engineering roles",
      ],
      categoryId: web.id,
      instructorId: instructor.id,
    },
    {
      title: "Mobile App Development with React Native: Android & iOS Mastery",
      slug: "mobile-app-development-react-native-android-ios",
      description:
        "Build fully functional cross‑platform mobile apps with React Native, covering navigation, native device features and store deployment.",
      thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c",
      previewVideo: "https://example.com/videos/mobile.mp4",
      price: 34.99,
      isPublished: true,
      isDeleted: false,
      hasCertificate: true,
      learningOutcomes: [
        "Create cross‑platform mobile apps",
        "Integrate native device APIs",
        "Implement navigation & state management",
        "Deploy apps to Google Play & Apple App Store",
      ],
      requirements: ["Basic React knowledge", "JavaScript fundamentals", "Mobile UI concepts helpful"],
      tags: ["mobile", "react-native", "android", "ios"],
      targetAudience: ["Mobile app beginners", "React developers expanding to mobile", "Freelancers building mobile solutions"],
      categoryId: mobile.id,
      instructorId: instructor.id,
    },
    {
      title: "Data Science & Analytics with Python and Real‑World Projects",
      slug: "data-science-analytics-python-real-world-projects",
      description:
        "Analyze real‑world datasets, clean & preprocess data, and generate insights using Python (Pandas, NumPy, Matplotlib).",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
      previewVideo: "https://example.com/videos/data.mp4",
      price: 59.99,
      isPublished: true,
      isDeleted: false,
      hasCertificate: true,
      learningOutcomes: [
        "Analyze & visualize real datasets",
        "Perform data cleaning & preprocessing",
        "Use Python data‑science libraries",
        "Generate actionable business insights",
        "Understand basic machine‑learning concepts",
      ],
      requirements: ["Basic Python programming", "Basic math & logical thinking", "Interest in data analysis"],
      tags: ["data-science", "python", "analytics", "pandas"],
      targetAudience: ["Beginners in data science", "Students & researchers", "Business analysts transitioning to data roles"],
      categoryId: data.id,
      instructorId: instructor.id,
    },
    {
      title: "Machine Learning & Artificial Intelligence Complete Guide",
      slug: "machine-learning-artificial-intelligence-complete-guide",
      description:
        "Roadmap to ML & AI covering supervised/unsupervised learning, neural networks, deep learning, model training & deployment using Python & Scikit‑learn.",
      thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
      previewVideo: "https://example.com/videos/ml.mp4",
      price: 69.99,
      isPublished: true,
      isDeleted: false,
      hasCertificate: true,
      learningOutcomes: [
        "Build ML models from scratch",
        "Understand neural networks & deep learning basics",
        "Train & evaluate AI models",
        "Work with real datasets for ML projects",
        "Deploy simple AI applications",
      ],
      requirements: ["Basic Python knowledge", "Basic algebra & math fundamentals", "Willingness to learn advanced concepts"],
      tags: ["machine-learning", "ai", "deep-learning"],
      targetAudience: ["AI & ML beginners", "Data‑science students", "Developers interested in AI careers"],
      categoryId: ml.id,
      instructorId: instructor.id,
    },
    {
      title: "Cyber Security & Ethical Hacking Professional Training",
      slug: "cyber-security-ethical-hacking-professional-training",
      description:
        "Learn how systems are attacked and defended. Covers ethical hacking, penetration testing, network security, vulnerability analysis and real‑world security practices.",
      thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
      previewVideo: "https://example.com/videos/security.mp4",
      price: 44.99,
      isPublished: true,
      isDeleted: false,
      hasCertificate: true,
      learningOutcomes: [
        "Understand cybersecurity fundamentals",
        "Perform ethical hacking techniques",
        "Analyze and secure network systems",
        "Identify application vulnerabilities",
        "Learn penetration testing basics",
      ],
      requirements: ["Basic IT knowledge", "Understanding of computers & networks", "Interest in cybersecurity"],
      tags: ["cybersecurity", "ethical-hacking", "security"],
      targetAudience: ["IT beginners entering cybersecurity", "System administrators", "Security enthusiasts"],
      categoryId: cyber.id,
      instructorId: instructor.id,
    },
    // Add any additional courses you need below …
  ];

  // ---------------------------------------------------------------
  // 7️⃣  Insert courses
  // ---------------------------------------------------------------
  await prisma.course.createMany({ data: courses });

  // ---------------------------------------------------------------
  // 8️⃣  Create Modules, Lessons and Assignments for every course
  // ---------------------------------------------------------------
  console.log("📦 Adding modules, lessons and assignments...");
  const createdCourses = await prisma.course.findMany({
    where: { slug: { in: courses.map((c) => c.slug) } },
  });

  // Helper to create a lesson record
  const createLesson = async (moduleId: string, order: number, title: string, videoUrl: string) => {
    await prisma.lesson.create({
      data: {
        title,
        videoUrl,
        duration: 12, // minutes – realistic placeholder
        order,
        moduleId,
      },
    });
  };

  for (const course of createdCourses) {
    // 3 modules per course
    for (let m = 1; m <= 3; m++) {
      const module = await prisma.module.create({
        data: {
          title: `Module ${m}: ${course.title}`,
          courseId: course.id,
          order: m,
        },
      });

      // 5 lessons per module
      for (let l = 1; l <= 5; l++) {
        await createLesson(
          module.id,
          l,
          `Lesson ${m}-${l} – ${course.title}`,
          `https://example.com/videos/${course.slug}/module${m}/lesson${l}.mp4`,
        );
      }

      // Optional: create 2 realistic assignments per module
      await prisma.assignment.createMany({
        data: [
          {
            description: `Assignment for Module ${m} – Part A (${course.title})`,
            moduleId: module.id,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          },
          {
            description: `Assignment for Module ${m} – Part B (${course.title})`,
            moduleId: module.id,
            deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          },
        ],
      });
    }
  }



  // ======================= live session==================

  const liveSessions = [
    {
      title:"Python for AI Roadmap",
      description:"Master Python basics, data structures, and libraries essential for Artificial Intelligence.",
      sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      meetingLink:"https://meet.google.com/qwe-abcd-xyz",
      isPublished:true,
      userId:instructor.id,
      level:"BEGINNER",
      keyTopics:["Python basics","Data structures","Libraries"],
      learningOutcomes:["Master Python basics","Understand data structures","Learn essential libraries"],
      whoShouldAttend:["Beginners"],
    }
    ,
    {
      title:"Complete Machine Learning Roadmap",
      description:"Build ML models from scratch, understand neural networks, and train AI models using Python & Scikit‑learn.",
      sessionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      meetingLink:"https://meet.google.com/fgh-erty-asd",
      isPublished:true,
      userId:instructor.id,
      level:"BEGINNER",
      keyTopics:["ML basics","Neural networks","Model training"],
      learningOutcomes:["Build ML models","Understand neural networks","Train AI models"],
      whoShouldAttend:["AI/ML beginners","Data‑science students"],
    },
    {
      title:"Cyber Security Essentials",
      description:"Learn ethical hacking, penetration testing, network security, and vulnerability analysis.",
      sessionDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      meetingLink:"https://meet.google.com/ghi-fgh-ijk",
      isPublished:true,
      userId:instructor.id,
      level:"INTERMEDIATE",
      keyTopics:["Ethical hacking","Penetration testing","Network security"],
      learningOutcomes:["Ethical hacking techniques","Penetration testing basics","Secure networks"],
      whoShouldAttend:["IT beginners","Security enthusiasts"],
    },
    {
      title:"AI Prompt Engineering Certification",
      description:"Master prompt design, model behavior, and advanced AI interaction techniques.",
      sessionDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      meetingLink:"https://meet.google.com/uvw-def-ghi",
      isPublished:true,
      userId:instructor.id,
      level:"ADVANCED",
      keyTopics:["Prompt design","Model behavior","AI interaction"],
      learningOutcomes:["Design effective prompts","Understand model behavior","Advanced AI interaction"],
      whoShouldAttend:["AI professionals","Developers","Researchers"],
    },
    {
      title:"Advanced Python for Data Science",
      description:"Deep dive into NumPy, Pandas, and advanced data manipulation techniques.",
      sessionDate:new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      registrationDeadline:new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      meetingLink:"https://meet.google.com/xyz-abc-def",
      isPublished:true,
      userId:instructor.id,
      level:"INTERMEDIATE",
      keyTopics:["NumPy arrays","Pandas DataFrames","Advanced manipulation"],
      learningOutcomes:["Master NumPy & Pandas","Handle complex data","Optimize data pipelines"],
      whoShouldAttend:["Data analysts","Data scientists","ML engineers"],
    },
    {
      title:"AI Ethics & Responsible AI",
      description:"Explore bias, fairness, accountability, and ethical practices in AI development.",
      sessionDate:new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
      registrationDeadline:new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      meetingLink:"https://meet.google.com/pqr-stu-vwx",
      isPublished:true,
      userId:instructor.id,
      level:"INTERMEDIATE",
      keyTopics:["AI bias","Fairness","Accountability"],
      learningOutcomes:["Identify AI bias","Ensure fairness","Build responsible AI"],
      whoShouldAttend:["AI developers","Policy makers","Researchers"],
    }
  ]

  await prisma.liveSession.createMany({ data: liveSessions });

  console.log("✅ Seed completed!");
}

// ---------------------------------------------------------------
// Run the seed script
// ---------------------------------------------------------------
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
