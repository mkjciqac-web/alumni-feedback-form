import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueries } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Download, Filter, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  CurrentStatus,
  DegreeType,
  LikertCurriculum,
  LikertTeaching,
} from "../backend";
import { AdminLayout } from "../components/Layout";
import { CURRICULUM_QUESTIONS, TEACHING_QUESTIONS } from "../constants";
import { useAdminAuth } from "../hooks/use-admin-auth";
import { useListSubmissions } from "../hooks/use-backend";
import type { Submission, SubmissionSummary } from "../types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function degreeLabel(d: DegreeType) {
  const map: Record<DegreeType, string> = {
    [DegreeType.UG]: "UG",
    [DegreeType.PG]: "PG",
    [DegreeType.MPhil]: "M.Phil",
  };
  return map[d] ?? String(d);
}

function degreeBadgeVariant(
  d: DegreeType,
): "default" | "secondary" | "outline" {
  if (d === DegreeType.UG) return "secondary";
  if (d === DegreeType.PG) return "default";
  return "outline";
}

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(s: CurrentStatus) {
  if (s === CurrentStatus.Working) return "Working";
  if (s === CurrentStatus.Studying) return "Studying";
  return "Other";
}

// Likert label + colour helpers
type LikertColor = "emerald" | "blue" | "sky" | "amber" | "red";

const CURRICULUM_COLORS: Record<LikertCurriculum, LikertColor> = {
  [LikertCurriculum.Excellent]: "emerald",
  [LikertCurriculum.VeryGood]: "blue",
  [LikertCurriculum.Good]: "sky",
  [LikertCurriculum.Satisfactory]: "amber",
  [LikertCurriculum.Unsatisfactory]: "red",
};

const CURRICULUM_ABBR: Record<LikertCurriculum, string> = {
  [LikertCurriculum.Excellent]: "E",
  [LikertCurriculum.VeryGood]: "VG",
  [LikertCurriculum.Good]: "G",
  [LikertCurriculum.Satisfactory]: "S",
  [LikertCurriculum.Unsatisfactory]: "U",
};

const CURRICULUM_FULL: Record<LikertCurriculum, string> = {
  [LikertCurriculum.Excellent]: "Excellent",
  [LikertCurriculum.VeryGood]: "Very Good",
  [LikertCurriculum.Good]: "Good",
  [LikertCurriculum.Satisfactory]: "Satisfactory",
  [LikertCurriculum.Unsatisfactory]: "Unsatisfactory",
};

const TEACHING_COLORS: Record<LikertTeaching, LikertColor> = {
  [LikertTeaching.excellent]: "emerald",
  [LikertTeaching.veryGood]: "blue",
  [LikertTeaching.good]: "sky",
  [LikertTeaching.satisfactory]: "amber",
  [LikertTeaching.unSatisfactory]: "red",
};

const TEACHING_ABBR: Record<LikertTeaching, string> = {
  [LikertTeaching.excellent]: "E",
  [LikertTeaching.veryGood]: "VG",
  [LikertTeaching.good]: "G",
  [LikertTeaching.satisfactory]: "S",
  [LikertTeaching.unSatisfactory]: "U",
};

const TEACHING_FULL: Record<LikertTeaching, string> = {
  [LikertTeaching.excellent]: "Excellent",
  [LikertTeaching.veryGood]: "Very Good",
  [LikertTeaching.good]: "Good",
  [LikertTeaching.satisfactory]: "Satisfactory",
  [LikertTeaching.unSatisfactory]: "Un Satisfactory",
};

const COLOR_CLASSES: Record<LikertColor, string> = {
  emerald:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  amber:
    "bg-amber-100 text-amber-800 dark:bg-amberald-900/40 dark:text-amber-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

function CLikert({ val }: { val: LikertCurriculum }) {
  const color = CURRICULUM_COLORS[val];
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${COLOR_CLASSES[color]}`}
      title={CURRICULUM_FULL[val]}
    >
      {CURRICULUM_ABBR[val]}
    </span>
  );
}

function TLikert({ val }: { val: LikertTeaching }) {
  const color = TEACHING_COLORS[val];
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${COLOR_CLASSES[color]}`}
      title={TEACHING_FULL[val]}
    >
      {TEACHING_ABBR[val]}
    </span>
  );
}

function TruncatedCell({ text }: { text: string }) {
  return (
    <span
      className="block max-w-[120px] truncate text-xs text-muted-foreground"
      title={text}
    >
      {text || "—"}
    </span>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type DegreeFilter = "all" | DegreeType;

// Combined row type after full details are fetched
interface FullRow {
  summary: SubmissionSummary;
  detail: Submission | null;
}

// ─── Excel export ─────────────────────────────────────────────────────────────

function buildExcelRows(rows: FullRow[]) {
  return rows.map((r, i) => {
    const s = r.summary;
    const d = r.detail;
    const reg = d?.registration;
    const cur = d?.curriculum;
    const tch = d?.teaching;

    const row: Record<string, string> = {
      "#": String(i + 1),
      "Submission ID": s.submissionId.toString(),
      "Submitted At": new Date(
        Number(s.submittedAt) / 1_000_000,
      ).toLocaleString("en-IN"),
      Name: s.name,
      Email: s.email,
      Phone: reg?.phone ?? "",
      Degree: degreeLabel(s.degreeType),
      Department: s.department,
      Batch: s.graduationYear.toString(),
      "Current Status": reg ? statusLabel(reg.currentStatus) : "",
      "Company/Organisation": reg?.company ?? "",
      "Designation/Role": reg?.designation ?? "",
      "College (Further Study)": reg?.college ?? "",
      "Program (Further Study)": reg?.program ?? "",
    };

    // Curriculum Likert
    if (cur) {
      const cKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;
      cKeys.forEach((q, idx) => {
        row[`C-Q${idx + 1}`] = CURRICULUM_FULL[cur[q]] ?? cur[q];
      });
      row["Curriculum Suggestions"] = cur.suggestions ?? "";
    } else {
      for (let i2 = 1; i2 <= 8; i2++) row[`C-Q${i2}`] = "";
      row["Curriculum Suggestions"] = "";
    }

    // Teaching Likert
    if (tch) {
      const tKeys = [
        "q1",
        "q2",
        "q3",
        "q4",
        "q5",
        "q6",
        "q7",
        "q8",
        "q9",
        "q10",
      ] as const;
      tKeys.forEach((q, idx) => {
        row[`T-Q${idx + 1}`] = TEACHING_FULL[tch[q]] ?? tch[q];
      });
      row["Additional Facilities"] = tch.additionalFacilities ?? "";
      row["Additional Comments"] = tch.additionalComments ?? "";
    } else {
      for (let i2 = 1; i2 <= 10; i2++) row[`T-Q${i2}`] = "";
      row["Additional Facilities"] = "";
      row["Additional Comments"] = "";
    }

    return row;
  });
}

// ─── Hook: fetch all details in parallel ─────────────────────────────────────

function useAllSubmissionDetails(summaries: SubmissionSummary[]) {
  // We need the actor internally — re-use the same pattern as use-backend.ts
  // but we can call useGetSubmission for each id. However useGetSubmission
  // needs to be called individually. Instead, use useQueries directly.
  // Import actor helper via a small inline approach using the existing pattern.
  // We'll import useBackendActorForQueries from use-backend via a new export.
  // Actually — use useQueries + same actor via use-backend's internal pattern.
  // Since we can't call hooks conditionally, we use useQueries with array.
  useListSubmissions(); // ensure actor is initialized before parallel queries
  return useQueries({
    queries: summaries.map((s) => ({
      queryKey: ["submission", s.submissionId.toString()],
      queryFn: async () => {
        // We'll import actor lazily using the exported createBackendActorOnce
        const { createBackendActorOnce } = await import("../hooks/use-backend");
        const actor = await createBackendActorOnce();
        return actor.getSubmission(s.submissionId);
      },
      staleTime: 5 * 60 * 1000,
    })),
  });
}

// ─── Column header with tooltip ──────────────────────────────────────────────

function TH({
  children,
  title,
  right,
  className = "",
}: {
  children: React.ReactNode;
  title?: string;
  right?: boolean;
  className?: string;
}) {
  return (
    <th
      title={title}
      className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap ${right ? "text-right" : "text-left"} ${className}`}
    >
      {children}
    </th>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminSubmissions() {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const { data: summaries, isLoading: listLoading } = useListSubmissions();
  const [search, setSearch] = useState("");
  const [degreeFilter, setDegreeFilter] = useState<DegreeFilter>("all");
  const [exporting, setExporting] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/admin/login" });
  }, [isAuthenticated, navigate]);

  // Fetch full details for all summaries in parallel
  const detailResults = useAllSubmissionDetails(summaries ?? []);

  // Combine summaries + detail results into FullRow[]
  const fullRows: FullRow[] = useMemo(() => {
    return (summaries ?? []).map((s, idx) => ({
      summary: s,
      detail:
        (detailResults[idx]?.data as Submission | null | undefined) ?? null,
    }));
  }, [summaries, detailResults]);

  const isLoadingDetails = detailResults.some((r) => r.isLoading);

  // Filtered rows
  const filtered = useMemo(() => {
    return fullRows.filter((r) => {
      const s = r.summary;
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase());
      const matchDegree =
        degreeFilter === "all" || s.degreeType === degreeFilter;
      return matchSearch && matchDegree;
    });
  }, [fullRows, search, degreeFilter]);

  const handleExportExcel = async () => {
    if (!summaries || summaries.length === 0) {
      toast.error("No submissions to export.");
      return;
    }
    if (isLoadingDetails) {
      toast.info("Details are still loading. Please wait a moment.");
      return;
    }
    setExporting(true);
    try {
      const rows = buildExcelRows(fullRows);
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
        wch:
          Math.max(
            key.length,
            ...rows.map((r) => String(r[key] ?? "").length),
          ) + 2,
      }));
      worksheet["!cols"] = colWidths;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Alumni Feedback");
      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `alumni-feedback-${dateStr}.xlsx`);
      toast.success("Excel file downloaded successfully");
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const filterTabs: { label: string; value: DegreeFilter }[] = [
    { label: "All", value: "all" },
    { label: "UG", value: DegreeType.UG },
    { label: "PG", value: DegreeType.PG },
    { label: "M.Phil", value: DegreeType.MPhil },
  ];

  const SKELETON_ROWS = Array.from({ length: 6 }, (_, i) => `sk-${i}`);

  const isLoading = listLoading;

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-4" data-ocid="admin.submissions_page">
        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Submissions
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `${summaries?.length ?? 0} total · All registration & feedback columns`}
              {!isLoading && isLoadingDetails && (
                <span className="ml-2 text-xs text-amber-500 animate-pulse">
                  · Loading details…
                </span>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExportExcel}
            disabled={exporting || isLoading}
            data-ocid="admin.export_excel_button"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Download Excel (All Columns)"}
          </Button>
        </div>

        {/* Table card */}
        <div className="form-card p-0 overflow-hidden">
          {/* Toolbar */}
          <div className="p-3 border-b border-border flex flex-wrap items-center gap-3 bg-muted/20">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium mr-1">
                Filter:
              </span>
              {filterTabs.map(({ label, value }) => (
                <button
                  type="button"
                  key={value}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
                    degreeFilter === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setDegreeFilter(value)}
                  data-ocid={`admin.filter.${value}_tab`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
                data-ocid="admin.search_input"
              />
            </div>
          </div>

          {/* Legend */}
          <div className="px-3 py-2 border-b border-border bg-muted/10 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="font-semibold">Likert legend:</span>
            {[
              { abbr: "E", label: "Excellent", color: "emerald" },
              { abbr: "VG", label: "Very Good", color: "blue" },
              { abbr: "G", label: "Good", color: "sky" },
              { abbr: "S", label: "Satisfactory", color: "amber" },
              { abbr: "U", label: "Unsatisfactory", color: "red" },
            ].map(({ abbr, label, color }) => (
              <span key={abbr} className="flex items-center gap-1">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${COLOR_CLASSES[color as LikertColor]}`}
                >
                  {abbr}
                </span>
                <span>{label}</span>
              </span>
            ))}
            <span className="ml-2 opacity-60">
              · Hover column headers for full question text
            </span>
          </div>

          {/* Scrollable table wrapper — both axes */}
          <div
            ref={tableRef}
            className="overflow-x-auto overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 280px)" }}
          >
            <table
              className="text-sm border-collapse"
              style={{ minWidth: "2800px" }}
            >
              {/* Sticky column group headers */}
              <thead className="sticky top-0 z-20 bg-muted/60 backdrop-blur-sm">
                {/* Section labels row */}
                <tr className="border-b border-border">
                  <th
                    colSpan={2}
                    className="px-3 py-1.5 text-[10px] font-bold text-center text-muted-foreground border-r border-border bg-muted/40"
                  >
                    #
                  </th>
                  <th
                    colSpan={11}
                    className="px-3 py-1.5 text-[10px] font-bold text-center text-muted-foreground border-r border-border bg-blue-50 dark:bg-blue-950/30"
                  >
                    REGISTRATION DETAILS
                  </th>
                  <th
                    colSpan={9}
                    className="px-3 py-1.5 text-[10px] font-bold text-center text-muted-foreground border-r border-border bg-violet-50 dark:bg-violet-950/30"
                  >
                    CURRICULUM FEEDBACK
                  </th>
                  <th
                    colSpan={12}
                    className="px-3 py-1.5 text-[10px] font-bold text-center text-muted-foreground bg-emerald-50 dark:bg-emerald-950/30"
                  >
                    TEACHING &amp; LEARNING FEEDBACK
                  </th>
                </tr>
                {/* Column label row */}
                <tr className="border-b-2 border-border">
                  {/* Index & ID */}
                  <TH className="bg-muted/60 border-r border-border w-10">#</TH>
                  <TH
                    className="bg-muted/60 border-r border-border"
                    title="Submission ID"
                  >
                    ID
                  </TH>
                  {/* Registration */}
                  <TH
                    className="bg-blue-50/80 dark:bg-blue-950/20"
                    title="Full Name"
                  >
                    Name
                  </TH>
                  <TH
                    className="bg-blue-50/80 dark:bg-blue-950/20"
                    title="Email Address"
                  >
                    Email
                  </TH>
                  <TH
                    className="bg-blue-50/80 dark:bg-blue-950/20"
                    title="Phone Number"
                  >
                    Phone
                  </TH>
                  <TH
                    className="bg-blue-50/80 dark:bg-blue-950/20"
                    title="Degree Type"
                  >
                    Degree
                  </TH>
                  <TH
                    className="bg-blue-50/80 dark:bg-blue-950/20"
                    title="Department"
                  >
                    Dept.
                  </TH>
                  <TH
                    className="bg-blue-50/80 dark:bg-blue-950/20"
                    title="Batch (Year Range)"
                  >
                    Batch
                  </TH>
                  <TH
                    className="bg-blue-50/80 dark:bg-blue-950/20"
                    title="Current Status (Working / Studying / Other)"
                  >
                    Status
                  </TH>
                  <TH
                    className="bg-blue-50/80 dark:bg-blue-950/20"
                    title="Company / Organisation"
                  >
                    Company
                  </TH>
                  <TH
                    className="bg-blue-50/80 dark:bg-blue-950/20"
                    title="Designation / Role"
                  >
                    Desgn.
                  </TH>
                  <TH
                    className="bg-blue-50/80 dark:bg-blue-950/20"
                    title="College (Further Study)"
                  >
                    College
                  </TH>
                  <TH
                    className="bg-blue-50/80 dark:bg-blue-950/20 border-r border-border"
                    title="Program (Further Study)"
                  >
                    Program
                  </TH>
                  {/* Curriculum */}
                  {CURRICULUM_QUESTIONS.map((q) => (
                    <TH
                      key={q}
                      className="bg-violet-50/80 dark:bg-violet-950/20"
                      title={q}
                    >
                      C-Q{CURRICULUM_QUESTIONS.indexOf(q) + 1}
                    </TH>
                  ))}
                  <TH
                    className="bg-violet-50/80 dark:bg-violet-950/20 border-r border-border"
                    title="Curriculum Suggestions (open-ended)"
                  >
                    C-Sugg.
                  </TH>
                  {/* Teaching */}
                  {TEACHING_QUESTIONS.map((q) => (
                    <TH
                      key={q}
                      className="bg-emerald-50/80 dark:bg-emerald-950/20"
                      title={q}
                    >
                      T-Q{TEACHING_QUESTIONS.indexOf(q) + 1}
                    </TH>
                  ))}
                  <TH
                    className="bg-emerald-50/80 dark:bg-emerald-950/20"
                    title="Additional Facilities suggestions (open-ended)"
                  >
                    T-Facil.
                  </TH>
                  <TH
                    className="bg-emerald-50/80 dark:bg-emerald-950/20"
                    title="Additional Comments (open-ended)"
                  >
                    T-Cmnt.
                  </TH>
                  {/* Date + Action */}
                  <TH title="Submission date">Submitted</TH>
                  <TH title="Actions">{""}</TH>
                </tr>
              </thead>

              <tbody>
                {/* Loading skeleton */}
                {isLoading &&
                  SKELETON_ROWS.map((k) => (
                    <tr key={k} className="border-t border-border">
                      {[
                        "c1",
                        "c2",
                        "c3",
                        "c4",
                        "c5",
                        "c6",
                        "c7",
                        "c8",
                        "c9",
                        "c10",
                        "c11",
                        "c12",
                        "c13",
                        "c14",
                        "c15",
                        "c16",
                        "c17",
                        "c18",
                        "c19",
                        "c20",
                        "c21",
                        "c22",
                        "c23",
                        "c24",
                        "c25",
                        "c26",
                        "c27",
                        "c28",
                        "c29",
                        "c30",
                        "c31",
                        "c32",
                        "c33",
                        "c34",
                        "c35",
                        "c36",
                      ].map((ck) => (
                        <td key={ck} className="px-3 py-2.5">
                          <Skeleton className="h-3 w-full min-w-[40px]" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {/* Empty state */}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={36}
                      className="px-4 py-14 text-center text-muted-foreground"
                      data-ocid="admin.submissions.empty_state"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">No submissions found</p>
                        <p className="text-xs">
                          {search || degreeFilter !== "all"
                            ? "Try adjusting your search or filter."
                            : "Submissions will appear here once alumni complete the feedback form."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!isLoading &&
                  filtered.map((row, i) => {
                    const s = row.summary;
                    const d = row.detail;
                    const reg = d?.registration;
                    const cur = d?.curriculum;
                    const tch = d?.teaching;
                    const loading =
                      detailResults[
                        (summaries ?? []).findIndex(
                          (x) => x.submissionId === s.submissionId,
                        )
                      ]?.isLoading;

                    return (
                      <tr
                        key={s.submissionId.toString()}
                        className="border-t border-border hover:bg-primary/5 transition-colors duration-150 cursor-pointer"
                        onClick={() =>
                          navigate({
                            to: `/admin/submissions/${s.submissionId}`,
                          })
                        }
                        onKeyUp={(e) => {
                          if (e.key === "Enter")
                            navigate({
                              to: `/admin/submissions/${s.submissionId}`,
                            });
                        }}
                        tabIndex={0}
                        data-ocid={`admin.submissions.item.${i + 1}`}
                      >
                        {/* # */}
                        <td className="px-3 py-2.5 text-xs text-muted-foreground border-r border-border text-center">
                          {i + 1}
                        </td>
                        {/* ID */}
                        <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground border-r border-border whitespace-nowrap">
                          #{s.submissionId.toString()}
                        </td>

                        {/* Registration columns */}
                        <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap text-sm">
                          {s.name}
                        </td>
                        <td className="px-3 py-2.5">
                          <TruncatedCell text={s.email} />
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {loading ? (
                            <Skeleton className="h-3 w-20" />
                          ) : (
                            (reg?.phone ?? "—")
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant={degreeBadgeVariant(s.degreeType)}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {degreeLabel(s.degreeType)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <TruncatedCell text={s.department} />
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                          {s.graduationYear.toString()}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {loading ? (
                            <Skeleton className="h-3 w-16" />
                          ) : reg ? (
                            statusLabel(reg.currentStatus)
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {loading ? (
                            <Skeleton className="h-3 w-20" />
                          ) : (
                            <TruncatedCell text={reg?.company ?? "—"} />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {loading ? (
                            <Skeleton className="h-3 w-16" />
                          ) : (
                            <TruncatedCell text={reg?.designation ?? "—"} />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {loading ? (
                            <Skeleton className="h-3 w-20" />
                          ) : (
                            <TruncatedCell text={reg?.college ?? "—"} />
                          )}
                        </td>
                        <td className="px-3 py-2.5 border-r border-border">
                          {loading ? (
                            <Skeleton className="h-3 w-20" />
                          ) : (
                            <TruncatedCell text={reg?.program ?? "—"} />
                          )}
                        </td>

                        {/* Curriculum Likert Q1–Q8 */}
                        {(
                          [
                            "q1",
                            "q2",
                            "q3",
                            "q4",
                            "q5",
                            "q6",
                            "q7",
                            "q8",
                          ] as const
                        ).map((q) => (
                          <td key={q} className="px-3 py-2.5 text-center">
                            {loading ? (
                              <Skeleton className="h-4 w-6 mx-auto" />
                            ) : cur ? (
                              <CLikert val={cur[q]} />
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                —
                              </span>
                            )}
                          </td>
                        ))}
                        {/* Curriculum suggestions */}
                        <td className="px-3 py-2.5 border-r border-border">
                          {loading ? (
                            <Skeleton className="h-3 w-20" />
                          ) : (
                            <TruncatedCell text={cur?.suggestions ?? "—"} />
                          )}
                        </td>

                        {/* Teaching Likert Q1–Q10 */}
                        {(
                          [
                            "q1",
                            "q2",
                            "q3",
                            "q4",
                            "q5",
                            "q6",
                            "q7",
                            "q8",
                            "q9",
                            "q10",
                          ] as const
                        ).map((q) => (
                          <td key={q} className="px-3 py-2.5 text-center">
                            {loading ? (
                              <Skeleton className="h-4 w-6 mx-auto" />
                            ) : tch ? (
                              <TLikert val={tch[q]} />
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                —
                              </span>
                            )}
                          </td>
                        ))}
                        {/* Teaching open-ended */}
                        <td className="px-3 py-2.5">
                          {loading ? (
                            <Skeleton className="h-3 w-20" />
                          ) : (
                            <TruncatedCell
                              text={tch?.additionalFacilities ?? "—"}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {loading ? (
                            <Skeleton className="h-3 w-20" />
                          ) : (
                            <TruncatedCell
                              text={tch?.additionalComments ?? "—"}
                            />
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(s.submittedAt)}
                        </td>

                        {/* Action */}
                        <td className="px-3 py-2.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10 whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate({
                                to: `/admin/submissions/${s.submissionId}`,
                              });
                            }}
                            data-ocid={`admin.submissions.view_button.${i + 1}`}
                          >
                            View →
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!isLoading && filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
              <span>
                Showing {filtered.length} of {summaries?.length ?? 0}{" "}
                submissions
              </span>
              {isLoadingDetails && (
                <span className="text-amber-500 animate-pulse text-[11px]">
                  Loading feedback details for all rows…
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
