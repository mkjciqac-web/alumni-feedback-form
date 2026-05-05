import type {
  BankDetails,
  CurrentStatus,
  CurriculumFeedback,
  DegreeType,
  IqacRow,
  IqacRowId,
  IqacRowInput,
  LikertCurriculum,
  LikertTeaching,
  Registration,
  Submission,
  SubmissionId,
  SubmissionSummary,
  SubmitFormInput,
  TeachingFeedback,
  Timestamp,
  UpdateActionTakenInput,
} from "./backend.d.ts";

export type {
  BankDetails,
  Registration,
  CurriculumFeedback,
  TeachingFeedback,
  Submission,
  SubmissionSummary,
  IqacRow,
  LikertCurriculum,
  LikertTeaching,
  CurrentStatus,
  DegreeType,
  IqacRowInput,
  SubmitFormInput,
  UpdateActionTakenInput,
  SubmissionId,
  IqacRowId,
  Timestamp,
};

export {
  LikertCurriculum as LikertCurriculumEnum,
  LikertTeaching as LikertTeachingEnum,
} from "./backend";
export {
  CurrentStatus as CurrentStatusEnum,
  DegreeType as DegreeTypeEnum,
} from "./backend";

export interface FormStep {
  id: number;
  label: string;
  key: "registration" | "curriculum" | "teaching";
}

export interface AdminUser {
  isAdmin: boolean;
  isLoading: boolean;
}

/** File attachments stored client-side (localStorage) per submission. */
export interface SubmissionFiles {
  appointmentOrder?: string | null;
  appointmentOrderName?: string | null;
  companyIdCard?: string | null;
  companyIdCardName?: string | null;
  collegeIdCard?: string | null;
  collegeIdCardName?: string | null;
}
