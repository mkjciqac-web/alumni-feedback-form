import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Registration {
    occupation?: string;
    name: string;
    designation?: string;
    collegeAddress?: string;
    graduationYear: bigint;
    email: string;
    company?: string;
    collegeIdCard?: string;
    companyIdCard?: string;
    degreeType: DegreeType;
    phone: string;
    department: string;
    companyAddress?: string;
    currentStatus: CurrentStatus;
    college?: string;
    program?: string;
    appointmentOrder?: string;
}
export interface IqacRowInput {
    matchingFeedbackExcerpts: Array<string>;
    weaknessText: string;
    actionTaken: string;
}
export interface SubmissionSummary {
    name: string;
    submittedAt: Timestamp;
    graduationYear: bigint;
    email: string;
    degreeType: DegreeType;
    submissionId: SubmissionId;
    department: string;
}
export interface http_header {
    value: string;
    name: string;
}
export type SubmissionId = bigint;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface SubmitFormInput {
    curriculum: CurriculumFeedback;
    registration: Registration;
    teaching: TeachingFeedback;
    contributionAmount?: bigint;
}
export interface BankDetails {
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
    upiId: string;
    accountNumber: string;
    uroPayApiKey: string;
}
export interface IqacRow {
    matchingFeedbackExcerpts: Array<string>;
    submissionId: SubmissionId;
    weaknessText: string;
    actionTaken: string;
    rowId: IqacRowId;
}
export interface CurriculumFeedback {
    q1: LikertCurriculum;
    q2: LikertCurriculum;
    q3: LikertCurriculum;
    q4: LikertCurriculum;
    q5: LikertCurriculum;
    q6: LikertCurriculum;
    q7: LikertCurriculum;
    q8: LikertCurriculum;
    suggestions: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface UpdateActionTakenInput {
    submissionId: SubmissionId;
    actionTaken: string;
    rowId: IqacRowId;
}
export interface TeachingFeedback {
    q1: LikertTeaching;
    q2: LikertTeaching;
    q3: LikertTeaching;
    q4: LikertTeaching;
    q5: LikertTeaching;
    q6: LikertTeaching;
    q7: LikertTeaching;
    q8: LikertTeaching;
    q9: LikertTeaching;
    q10: LikertTeaching;
    additionalComments: string;
    additionalFacilities: string;
}
export type IqacRowId = bigint;
export interface Submission {
    curriculum: CurriculumFeedback;
    registration: Registration;
    submittedAt: Timestamp;
    teaching: TeachingFeedback;
    contributionAmount?: bigint;
    submissionId: SubmissionId;
}
export enum CurrentStatus {
    Studying = "Studying",
    Working = "Working",
    Other = "Other"
}
export enum DegreeType {
    PG = "PG",
    UG = "UG",
    MPhil = "MPhil"
}
export enum LikertCurriculum {
    VeryGood = "VeryGood",
    Satisfactory = "Satisfactory",
    Good = "Good",
    Excellent = "Excellent",
    Unsatisfactory = "Unsatisfactory"
}
export enum LikertTeaching {
    unSatisfactory = "unSatisfactory",
    veryGood = "veryGood",
    good = "good",
    satisfactory = "satisfactory",
    excellent = "excellent"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    analyzeSubmission(submissionId: SubmissionId): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    exportCsv(): Promise<string>;
    getBankDetails(): Promise<BankDetails | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGeminiApiKey(): Promise<string>;
    getIqacRows(submissionId: SubmissionId): Promise<Array<IqacRow>>;
    getSubmission(id: SubmissionId): Promise<Submission | null>;
    isCallerAdmin(): Promise<boolean>;
    listSubmissions(): Promise<Array<SubmissionSummary>>;
    saveIqacRows(submissionId: SubmissionId, rows: Array<IqacRowInput>): Promise<void>;
    setBankDetails(details: BankDetails): Promise<void>;
    setGeminiApiKey(key: string): Promise<void>;
    submitForm(input: SubmitFormInput): Promise<SubmissionId>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateActionTaken(input: UpdateActionTakenInput): Promise<void>;
}
