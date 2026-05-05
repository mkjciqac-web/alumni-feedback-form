import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  ExternalLink,
  FileText,
  GraduationCap,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CurrentStatus, DegreeType } from "../backend";
import type { LikertCurriculum, LikertTeaching } from "../backend";
import { AdminLayout } from "../components/Layout";
import {
  CURRICULUM_QUESTIONS,
  LIKERT_CURRICULUM_OPTIONS,
  LIKERT_TEACHING_OPTIONS,
  TEACHING_QUESTIONS,
} from "../constants";
import { useAdminAuth } from "../hooks/use-admin-auth";
import { useGetSubmission } from "../hooks/use-backend";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function likertCurriculumLabel(v: LikertCurriculum) {
  return (
    LIKERT_CURRICULUM_OPTIONS.find((o) => o.value === v)?.label ?? String(v)
  );
}
function likertTeachingLabel(v: LikertTeaching) {
  return LIKERT_TEACHING_OPTIONS.find((o) => o.value === v)?.label ?? String(v);
}
function degreeLabel(d: DegreeType) {
  const map: Record<DegreeType, string> = {
    [DegreeType.UG]: "UG",
    [DegreeType.PG]: "PG",
    [DegreeType.MPhil]: "M.Phil",
  };
  return map[d] ?? String(d);
}
function statusLabel(s: CurrentStatus) {
  return s === CurrentStatus.Working
    ? "Working"
    : s === CurrentStatus.Studying
      ? "Studying"
      : "Other";
}
function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type LikertKey = `q${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`;

// ─── Likert Badge Colors ──────────────────────────────────────────────────────

function getLikertBadgeClass(label: string): string {
  switch (label) {
    case "Excellent":
      return "border-emerald-500/50 text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40";
    case "Very Good":
      return "border-blue-500/50 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40";
    case "Good":
      return "border-sky-400/50 text-sky-700 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/40";
    case "Satisfactory":
      return "border-amber-500/50 text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40";
    case "Unsatisfactory":
    case "Un Satisfactory":
      return "border-red-500/50 text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40";
    default:
      return "border-border text-muted-foreground";
  }
}

// ─── Field Row ────────────────────────────────────────────────────────────────

function FieldRow({
  label,
  value,
  missing = false,
  ocid,
}: {
  label: string;
  value?: string | null;
  missing?: boolean;
  ocid?: string;
}) {
  return (
    <div
      className="space-y-1 p-3 bg-muted/30 rounded-md border border-border"
      data-ocid={ocid}
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      {missing || !value ? (
        <p className="text-sm italic text-muted-foreground/70">Not provided</p>
      ) : (
        <p className="text-sm font-semibold text-foreground break-words">
          {value}
        </p>
      )}
    </div>
  );
}

// ─── File Attachment Row ──────────────────────────────────────────────────────

function FileRow({
  label,
  dataUrl,
  fileName,
  ocid,
}: {
  label: string;
  dataUrl?: string | null;
  fileName?: string | null;
  ocid?: string;
}) {
  return (
    <div
      className="space-y-1 p-3 bg-muted/30 rounded-md border border-border"
      data-ocid={ocid}
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" />
        {label}
      </p>
      {dataUrl ? (
        <a
          href={dataUrl}
          download={fileName ?? label}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline break-all"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          {fileName ?? "View / Download file"}
        </a>
      ) : (
        <p className="text-sm italic text-muted-foreground/70">Not provided</p>
      )}
    </div>
  );
}

// ─── Open-Ended Text Block ────────────────────────────────────────────────────

function OpenEndedBlock({
  questionNum,
  label,
  text,
  ocid,
}: {
  questionNum?: number;
  label: string;
  text?: string | null;
  ocid?: string;
}) {
  return (
    <div
      className="col-span-full p-4 bg-muted/40 rounded-md border border-border space-y-1.5"
      data-ocid={ocid}
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {questionNum !== undefined ? `Q${questionNum} — ` : ""}
        {label}
      </p>
      {text ? (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
          {text}
        </p>
      ) : (
        <p className="text-sm italic text-muted-foreground/70">
          No response provided
        </p>
      )}
    </div>
  );
}

// ─── Questions Grid ───────────────────────────────────────────────────────────

function QuestionsGrid<T extends string>({
  questions,
  answers,
  labelFn,
  section,
}: {
  questions: string[];
  answers: Record<LikertKey, T>;
  labelFn: (v: T) => string;
  section: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {questions.map((q, i) => {
        const key = `q${i + 1}` as LikertKey;
        const val = answers[key];
        const label = labelFn(val);
        const badgeClass = getLikertBadgeClass(label);

        return (
          <div
            key={key}
            className="flex items-start gap-3 p-3 bg-muted/30 rounded-md border border-border hover:bg-muted/50 transition-colors duration-200"
            data-ocid={`submission.${section}_question.${i + 1}`}
          >
            <span className="text-primary font-bold text-xs mt-0.5 shrink-0 w-6 text-right">
              Q{i + 1}.
            </span>
            <p className="flex-1 min-w-0 text-sm text-foreground leading-snug">
              {q}
            </p>
            <Badge
              variant="outline"
              className={`shrink-0 text-xs font-semibold whitespace-nowrap ${badgeClass}`}
            >
              {label}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SubmissionDetail() {
  const params = useParams({ from: "/admin/submissions/$id" });
  const navigate = useNavigate();

  let submissionId: bigint | null = null;
  try {
    submissionId = BigInt(params.id);
  } catch {
    // invalid id
  }

  if (submissionId === null) {
    return (
      <AdminLayout>
        <div
          className="p-6 text-center text-muted-foreground py-20"
          data-ocid="submission.error_state"
        >
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Invalid submission ID.</p>
          <Button
            variant="link"
            size="sm"
            className="mt-2"
            onClick={() => navigate({ to: "/admin/submissions" })}
          >
            Back to Submissions
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return <SubmissionDetailInner submissionId={submissionId} />;
}

function SubmissionDetailInner({ submissionId }: { submissionId: bigint }) {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();

  const { data: submission, isLoading } = useGetSubmission(submissionId);
  const [activeTab, setActiveTab] = useState("registration");

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/admin/login" });
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-full max-w-lg" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!submission) {
    return (
      <AdminLayout>
        <div
          className="p-6 text-center text-muted-foreground py-20"
          data-ocid="submission.error_state"
        >
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Submission not found.</p>
          <Button
            variant="link"
            size="sm"
            className="mt-2"
            onClick={() => navigate({ to: "/admin/submissions" })}
          >
            Back to Submissions
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const { registration, curriculum, teaching } = submission;

  return (
    <AdminLayout>
      <div
        className="p-6 space-y-5 max-w-screen-xl"
        data-ocid="submission.detail_page"
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: "/admin/submissions" })}
            data-ocid="submission.back_button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Submissions
          </Button>
          <div className="w-px h-5 bg-border" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display text-xl font-bold text-foreground">
                {registration.name}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {degreeLabel(registration.degreeType)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {registration.department}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs border-primary/30 text-primary"
              >
                {statusLabel(registration.currentStatus)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {registration.email} · Submitted{" "}
              {formatDate(submission.submittedAt)}
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-sm">
            <TabsTrigger
              value="registration"
              data-ocid="submission.registration_tab"
            >
              Registration
            </TabsTrigger>
            <TabsTrigger
              value="curriculum"
              data-ocid="submission.curriculum_tab"
            >
              Curriculum
            </TabsTrigger>
            <TabsTrigger value="teaching" data-ocid="submission.teaching_tab">
              Teaching
            </TabsTrigger>
          </TabsList>

          {/* ── Registration Tab ── */}
          <TabsContent value="registration" className="mt-4">
            <div
              className="form-card space-y-5"
              data-ocid="submission.registration_section"
            >
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Personal &amp; Academic Details
              </h3>

              {/* Core fields — 3 columns on large, 2 on sm */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Core Information
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <FieldRow
                    label="Full Name"
                    value={registration.name}
                    ocid="submission.reg.name"
                  />
                  <FieldRow
                    label="Email Address"
                    value={registration.email}
                    ocid="submission.reg.email"
                  />
                  <FieldRow
                    label="Phone Number"
                    value={registration.phone}
                    ocid="submission.reg.phone"
                  />
                  <FieldRow
                    label="Degree Type"
                    value={degreeLabel(registration.degreeType)}
                    ocid="submission.reg.degree"
                  />
                  <FieldRow
                    label="Department"
                    value={registration.department}
                    ocid="submission.reg.department"
                  />
                  <FieldRow
                    label="Batch"
                    value={registration.graduationYear.toString()}
                    ocid="submission.reg.batch"
                  />
                  <FieldRow
                    label="Current Status"
                    value={statusLabel(registration.currentStatus)}
                    ocid="submission.reg.status"
                  />
                </div>
              </div>

              {/* Optional fields — always shown */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Employment &amp;
                  Further Study
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldRow
                    label="Company / Organisation"
                    value={registration.company?.[0] ?? null}
                    missing={!registration.company?.[0]}
                    ocid="submission.reg.company"
                  />
                  <FieldRow
                    label="Designation / Role"
                    value={registration.designation?.[0] ?? null}
                    missing={!registration.designation?.[0]}
                    ocid="submission.reg.designation"
                  />
                  <FieldRow
                    label="College (Further Study)"
                    value={registration.college?.[0] ?? null}
                    missing={!registration.college?.[0]}
                    ocid="submission.reg.college"
                  />
                  <FieldRow
                    label="Program (Further Study)"
                    value={registration.program?.[0] ?? null}
                    missing={!registration.program?.[0]}
                    ocid="submission.reg.program"
                  />
                  <FileRow
                    label="Appointment Order"
                    dataUrl={registration.appointmentOrder?.[0] ?? null}
                    fileName="View / Download Appointment Order"
                    ocid="submission.reg.appointment_order"
                  />
                  <FileRow
                    label="Company ID Card"
                    dataUrl={registration.companyIdCard?.[0] ?? null}
                    fileName="View / Download Company ID Card"
                    ocid="submission.reg.company_id_card"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Curriculum Tab ── */}
          <TabsContent value="curriculum" className="mt-4">
            <div
              className="form-card space-y-5"
              data-ocid="submission.curriculum_section"
            >
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Curriculum Feedback
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  8 questions
                </span>
              </h3>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  "Excellent",
                  "Very Good",
                  "Good",
                  "Satisfactory",
                  "Unsatisfactory",
                ].map((lbl) => (
                  <span
                    key={lbl}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium ${getLikertBadgeClass(lbl)}`}
                  >
                    {lbl}
                  </span>
                ))}
              </div>

              <QuestionsGrid
                questions={CURRICULUM_QUESTIONS}
                answers={
                  curriculum as unknown as Record<LikertKey, LikertCurriculum>
                }
                labelFn={likertCurriculumLabel}
                section="curriculum"
              />

              <OpenEndedBlock
                label="Suggestions / Comments"
                text={curriculum.suggestions}
                ocid="submission.curriculum.suggestions"
              />
            </div>
          </TabsContent>

          {/* ── Teaching Tab ── */}
          <TabsContent value="teaching" className="mt-4">
            <div
              className="form-card space-y-5"
              data-ocid="submission.teaching_section"
            >
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Teaching &amp; Learning Feedback
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  10 rated + 2 open-ended
                </span>
              </h3>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  "Excellent",
                  "Very Good",
                  "Good",
                  "Satisfactory",
                  "Un Satisfactory",
                ].map((lbl) => (
                  <span
                    key={lbl}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium ${getLikertBadgeClass(lbl)}`}
                  >
                    {lbl}
                  </span>
                ))}
              </div>

              <QuestionsGrid
                questions={TEACHING_QUESTIONS}
                answers={
                  teaching as unknown as Record<LikertKey, LikertTeaching>
                }
                labelFn={likertTeachingLabel}
                section="teaching"
              />

              {/* Open-ended — full width */}
              <div className="grid grid-cols-1 gap-3">
                <OpenEndedBlock
                  questionNum={11}
                  label="What additional facilities or support services do you suggest?"
                  text={teaching.additionalFacilities}
                  ocid="submission.teaching.additional_facilities"
                />
                <OpenEndedBlock
                  questionNum={12}
                  label="Any other comments or suggestions?"
                  text={teaching.additionalComments}
                  ocid="submission.teaching.additional_comments"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
