import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.4/index.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],

  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = "http://localhost:5000/api";

const TEST_EMAIL = __ENV.TEST_EMAIL || "student@mentoro.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "password123";

/* ================= LOGIN ================= */
export function setup() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  check(res, {
    "login success": (r) => r.status === 200,
  });

  const token = res.json()?.data?.accessToken;

  return { token };
}

/* ================= MAIN FLOW ================= */
export default function (data) {
  const token = data.token;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  let courseId = null;
  let courseSlug = null;
  let enrollId = null;

  /* ================= GET COURSES ================= */
  const coursesRes = http.get(`${BASE_URL}/courses`);

  check(coursesRes, {
    "courses loaded": (r) => r.status === 200,
  });

  try {
    const body = coursesRes.json();
    const courses = body?.data?.data || body?.data || [];

    if (courses.length > 0) {
      courseId = courses[0].id;
      courseSlug = courses[0].slug;
    }
  } catch (e) {}

  sleep(1);

  /* ================= COURSE DETAIL ================= */
  if (courseSlug) {
    const detailRes = http.get(
      `${BASE_URL}/courses/slug/${courseSlug}`
    );

    check(detailRes, {
      "course detail loaded": (r) => r.status === 200,
    });
  }

  sleep(1);

  /* ================= ENROLL COURSE (IMPORTANT FIX) ================= */
  if (courseId) {
    const enrollRes = http.post(
      `${BASE_URL}/enrollments`,
      JSON.stringify({
        courseId: courseId,
      }),
      { headers }
    );

    check(enrollRes, {
      "enrollment created": (r) => r.status === 200 || r.status === 201,
    });

    try {
      enrollId = enrollRes.json()?.data?.id;
    } catch (e) {}
  }

  sleep(1);

  /* ================= PAYMENT CHECKOUT ================= */
  if (courseId && enrollId) {
    const checkoutRes = http.post(
      `${BASE_URL}/payments/checkout`,
      JSON.stringify({
        courseId: courseId,
        enrollId: enrollId,
      }),
      { headers }
    );

    check(checkoutRes, {
      "checkout created": (r) => r.status === 200 || r.status === 201,
    });
  }

  sleep(1);

  /* ================= MODULES ================= */
  if (courseId) {
    const moduleRes = http.get(
      `${BASE_URL}/courses/me/${courseId}/modules`,
      { headers }
    );

    check(moduleRes, {
      "modules loaded": (r) => r.status === 200,
    });

    let modules = [];

    try {
      modules = moduleRes.json()?.data || [];
    } catch (e) {}

    /* ================= COMPLETE LESSON ================= */
    if (modules.length > 0 && modules[0].lessons?.length > 0) {
      const lessonId = modules[0].lessons[0].id;

      const completeRes = http.post(
        `${BASE_URL}/courses/me/lesson/complete`,
        JSON.stringify({
          courseId: courseId,
          lessonId: lessonId,
        }),
        { headers }
      );

      check(completeRes, {
        "lesson completed": (r) => r.status === 200,
      });
    }
  }

  sleep(1);
}

/* ================= REPORT ================= */
export function handleSummary(data) {
  return {
    "benchmark_report.json": JSON.stringify(data, null, 2),
    "benchmark_report.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}