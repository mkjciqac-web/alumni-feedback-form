import type { backendInterface } from "../backend";
import {
  CurrentStatus,
  DegreeType,
  LikertCurriculum,
  LikertTeaching,
  UserRole,
} from "../backend";

export const mockBackend: backendInterface = {
  analyzeSubmission: async (_submissionId) =>
    JSON.stringify({
      strengths: [
        "Strong curriculum coverage of core subjects",
        "Good practical exposure through labs and projects",
        "Supportive faculty interactions",
      ],
      weaknesses: [
        "Limited industry-relevant electives",
        "Outdated syllabus in some areas",
        "Insufficient soft skills training",
      ],
      improvements: [
        "Introduce more industry-relevant electives",
        "Update syllabus with current technologies",
        "Add dedicated soft skills development modules",
      ],
      iqacRows: [
        {
          weaknessText: "Limited industry-relevant electives",
          actionTaken: "",
          matchingFeedbackExcerpts: [
            "The curriculum lacks modern elective courses that match industry needs.",
            "I wish there were more options for specialized tracks.",
          ],
        },
        {
          weaknessText: "Outdated syllabus in some areas",
          actionTaken: "",
          matchingFeedbackExcerpts: [
            "Some subjects felt outdated compared to what employers look for.",
          ],
        },
        {
          weaknessText: "Insufficient soft skills training",
          actionTaken: "",
          matchingFeedbackExcerpts: [
            "More emphasis on communication and teamwork skills would have been helpful.",
          ],
        },
      ],
    }),

  assignCallerUserRole: async (_user, _role) => undefined,

  exportCsv: async () =>
    "submissionId,name,email,department,degreeType,graduationYear,submittedAt\n1,Arun Kumar,arun@example.com,Computer Science,UG,2022,2024-01-10T09:00:00Z\n2,Priya Sharma,priya@example.com,Electronics,PG,2023,2024-01-12T10:30:00Z",

  getCallerUserRole: async () => UserRole.admin,

  getGeminiApiKey: async () => "AIza-sample-key-1234567890",

  getIqacRows: async (_submissionId) => [
    {
      rowId: BigInt(1),
      submissionId: BigInt(1),
      weaknessText: "Limited industry-relevant electives",
      actionTaken: "Board of Studies has been advised to revise elective offerings for next academic year.",
      matchingFeedbackExcerpts: [
        "The curriculum lacks modern elective courses that match industry needs.",
        "I wish there were more options for specialized tracks.",
      ],
    },
    {
      rowId: BigInt(2),
      submissionId: BigInt(1),
      weaknessText: "Outdated syllabus in some areas",
      actionTaken: "",
      matchingFeedbackExcerpts: [
        "Some subjects felt outdated compared to what employers look for.",
      ],
    },
    {
      rowId: BigInt(3),
      submissionId: BigInt(1),
      weaknessText: "Insufficient soft skills training",
      actionTaken: "Soft skills workshop has been planned for next semester.",
      matchingFeedbackExcerpts: [
        "More emphasis on communication and teamwork skills would have been helpful.",
      ],
    },
  ],

  getSubmission: async (_id) => ({
    submissionId: BigInt(1),
    submittedAt: BigInt(Date.now()) * BigInt(1_000_000),
    registration: {
      name: "Arun Kumar",
      email: "arun@example.com",
      phone: "9876543210",
      degreeType: DegreeType.UG,
      department: "Computer Science",
      graduationYear: BigInt(2022),
      currentStatus: CurrentStatus.Working,
      designation: "Software Engineer",
      company: "Tech Corp",
    },
    curriculum: {
      q1: LikertCurriculum.Excellent,
      q2: LikertCurriculum.VeryGood,
      q3: LikertCurriculum.Good,
      q4: LikertCurriculum.Excellent,
      q5: LikertCurriculum.VeryGood,
      q6: LikertCurriculum.Good,
      q7: LikertCurriculum.Satisfactory,
      q8: LikertCurriculum.VeryGood,
      suggestions:
        "The curriculum could benefit from more industry-aligned projects and internship opportunities. Overall a solid foundation was provided.",
    },
    teaching: {
      q1: LikertTeaching.excellent,
      q2: LikertTeaching.veryGood,
      q3: LikertTeaching.excellent,
      q4: LikertTeaching.veryGood,
      q5: LikertTeaching.good,
      q6: LikertTeaching.veryGood,
      q7: LikertTeaching.excellent,
      q8: LikertTeaching.veryGood,
      q9: LikertTeaching.good,
      q10: LikertTeaching.veryGood,
      additionalFacilities: "",
      additionalComments:
        "Faculty were generally very supportive and knowledgeable. Some improvements in hands-on lab sessions would be beneficial.",
    },
  }),

  isCallerAdmin: async () => true,

  listSubmissions: async () => [
    {
      submissionId: BigInt(1),
      name: "Arun Kumar",
      email: "arun@example.com",
      department: "Computer Science",
      degreeType: DegreeType.UG,
      graduationYear: BigInt(2022),
      submittedAt: BigInt(Date.now() - 86400000) * BigInt(1_000_000),
    },
    {
      submissionId: BigInt(2),
      name: "Priya Sharma",
      email: "priya@example.com",
      department: "Electronics",
      degreeType: DegreeType.PG,
      graduationYear: BigInt(2023),
      submittedAt: BigInt(Date.now() - 172800000) * BigInt(1_000_000),
    },
    {
      submissionId: BigInt(3),
      name: "Raj Patel",
      email: "raj@example.com",
      department: "Mechanical Engineering",
      degreeType: DegreeType.UG,
      graduationYear: BigInt(2021),
      submittedAt: BigInt(Date.now() - 259200000) * BigInt(1_000_000),
    },
  ],

  saveIqacRows: async (_submissionId, _rows) => undefined,

  setGeminiApiKey: async (_key) => undefined,

  submitForm: async (_input) => BigInt(4),

  transform: async (_input) => ({
    status: BigInt(200),
    body: new Uint8Array(),
    headers: [],
  }),

  updateActionTaken: async (_input) => undefined,

  getBankDetails: async () => null,

  setBankDetails: async (_details) => undefined,

  _initializeAccessControl: async () => undefined,
};
