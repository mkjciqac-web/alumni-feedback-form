import { LikertCurriculum, LikertTeaching } from "./backend";

export const UG_DEPARTMENTS = [
  "TAMIL",
  "ENGLISH",
  "MATHEMATICS",
  "STATISTICS",
  "COMPUTER SCIENCE",
  "COMPUTER APPLICATIONS",
  "COMMERCE",
  "COMMERCE COMPUTER APPLICATIONS",
  "BUSINESS ADMINISTRATION",
  "BIOCHEMISTRY",
  "BIOTECHNOLOGY",
  "PHYSICS",
  "CHEMISTRY",
  "ND",
  "ID",
  "PSYCHOLOGY",
];

export const PG_DEPARTMENTS = [
  "TAMIL",
  "ENGLISH",
  "MATHEMATICS",
  "COMPUTER SCIENCE",
  "COMPUTER APPLICATIONS",
  "COMMERCE",
  "COMMERCE COMPUTER APPLICATIONS",
  "BUSINESS ADMINISTRATION",
  "BIOCHEMISTRY",
  "BIOTECHNOLOGY",
  "PHYSICS",
  "CHEMISTRY",
  "ND",
  "PSYCHOLOGY",
];

export const MPHIL_DEPARTMENTS = [
  "MATHEMATICS",
  "COMPUTER SCIENCE",
  "COMMERCE",
  "BIOCHEMISTRY",
  "ENGLISH",
];

export const CURRICULUM_QUESTIONS = [
  "How would you rate the relevance of the curriculum to current industry needs?",
  "How would you rate the depth and breadth of the course content?",
  "How adequate was the practical/laboratory component of the curriculum?",
  "How effectively did the curriculum incorporate interdisciplinary learning?",
  "How would you rate the availability and quality of study materials?",
  "How well did the curriculum prepare you for higher education?",
  "How would you rate the alignment of curriculum with professional standards?",
  "How satisfied are you with the overall curriculum design and structure?",
];

// First 10 questions are Likert-rated (mapped to q1–q10 in backend)
// Q11 = additionalFacilities, Q12 = additionalComments
export const TEACHING_QUESTIONS = [
  "Teachers explained concepts clearly and effectively",
  "Teaching methods used (lectures, PPTs, activities, discussions) improved my learning",
  "Teachers were approachable and supportive",
  "Classroom interaction and participation were encouraged",
  "Assessment methods were fair and transparent",
  "Practical/lab sessions were useful and well-organized",
  "Library resources (books, journals, e-resources) were adequate",
  "ICT facilities (smart class, LMS, online materials) supported my learning",
  "Sports, extracurricular, and extension activities were useful for holistic development",
  "Administrative support (office, exam cell, department) was timely and efficient",
];

export const LIKERT_CURRICULUM_OPTIONS: {
  value: LikertCurriculum;
  label: string;
}[] = [
  { value: LikertCurriculum.Excellent, label: "Excellent" },
  { value: LikertCurriculum.VeryGood, label: "Very Good" },
  { value: LikertCurriculum.Good, label: "Good" },
  { value: LikertCurriculum.Satisfactory, label: "Satisfactory" },
  { value: LikertCurriculum.Unsatisfactory, label: "Unsatisfactory" },
];

// Teaching Likert options use the new backend enum keys
export const LIKERT_TEACHING_OPTIONS: {
  value: LikertTeaching;
  label: string;
}[] = [
  { value: LikertTeaching.excellent, label: "Excellent" },
  { value: LikertTeaching.veryGood, label: "Very Good" },
  { value: LikertTeaching.good, label: "Good" },
  { value: LikertTeaching.satisfactory, label: "Satisfactory" },
  { value: LikertTeaching.unSatisfactory, label: "Un Satisfactory" },
];

export const FORM_STEPS = [
  { id: 1, label: "Registration", key: "registration" as const },
  { id: 2, label: "Curriculum", key: "curriculum" as const },
  { id: 3, label: "Teaching", key: "teaching" as const },
];

/**
 * UG batches: 3-year spans (e.g. 1995-1998, 1996-1999, ...) rolling by 1 year
 * Each entry covers [start, start+3]. Last entry: 2022-2025.
 */
export function generateUGBatches(): string[] {
  const batches: string[] = [];
  for (let start = 1995; start <= 2022; start++) {
    batches.push(`${start}-${start + 3}`);
  }
  return batches;
}

/**
 * PG / M.Phil batches: 1-year academic spans (e.g. 1995-1996, 1996-1997, ...) rolling by 1 year
 * Last entry: 2024-2025.
 */
export function generatePGBatches(): string[] {
  const batches: string[] = [];
  for (let start = 1995; start <= 2024; start++) {
    batches.push(`${start}-${start + 1}`);
  }
  return batches;
}
