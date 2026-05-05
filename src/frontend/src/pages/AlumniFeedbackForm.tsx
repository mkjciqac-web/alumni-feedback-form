import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  FileText,
  GraduationCap,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  CurrentStatus,
  DegreeType,
  LikertCurriculum,
  LikertTeaching,
} from "../backend";
import { ContributionPaymentModal } from "../components/ContributionPaymentModal";
import { PublicLayout } from "../components/Layout";
import { LikertScale } from "../components/LikertScale";
import { StepIndicator } from "../components/StepIndicator";
import {
  CURRICULUM_QUESTIONS,
  FORM_STEPS,
  LIKERT_CURRICULUM_OPTIONS,
  LIKERT_TEACHING_OPTIONS,
  MPHIL_DEPARTMENTS,
  PG_DEPARTMENTS,
  TEACHING_QUESTIONS,
  UG_DEPARTMENTS,
  generatePGBatches,
  generateUGBatches,
} from "../constants";
import {
  fileToDataUrl,
  useGetBankDetails,
  useSubmitForm,
} from "../hooks/use-backend";
import type {
  CurriculumFeedback,
  Registration,
  SubmitFormInput,
} from "../types";

// Extended teaching form state — all 10 Likert + 2 textarea fields map directly to backend
type TeachingFormState = {
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
  additionalFacilities: string;
  additionalComments: string;
};

type FormData = {
  registration: Registration;
  curriculum: CurriculumFeedback;
  teaching: TeachingFormState;
};

function getDepartments(degreeType: DegreeType | undefined) {
  if (degreeType === DegreeType.UG) return UG_DEPARTMENTS;
  if (degreeType === DegreeType.PG) return PG_DEPARTMENTS;
  if (degreeType === DegreeType.MPhil) return MPHIL_DEPARTMENTS;
  return [];
}

function getBatches(degreeType: DegreeType | undefined): string[] {
  if (degreeType === DegreeType.UG) return generateUGBatches();
  if (degreeType === DegreeType.PG || degreeType === DegreeType.MPhil)
    return generatePGBatches();
  return generateUGBatches();
}

export function AlumniFeedbackForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submittedId, setSubmittedId] = useState<bigint | null>(null);
  const [appointmentOrderFile, setAppointmentOrderFile] = useState<File | null>(
    null,
  );
  const [companyIdCardFile, setCompanyIdCardFile] = useState<File | null>(null);
  const [collegeIdCardFile, setCollegeIdCardFile] = useState<File | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  // Contribution option — single selection via radio button
  const [contributionOption, setContributionOption] = useState<string | null>(
    null,
  );
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionAmountError, setContributionAmountError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  // 'idle' = not started, 'waiting' = opened modal but dismissed, 'verified' = verified OK
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "waiting" | "verified"
  >("idle");

  // Payment is required only when one of these two options is selected
  const PAYMENT_OPTIONS = ["poor_students", "orphanages"] as const;
  const needsPayment =
    contributionOption !== null &&
    PAYMENT_OPTIONS.includes(
      contributionOption as (typeof PAYMENT_OPTIONS)[number],
    );

  const appointmentOrderRef = useRef<HTMLInputElement>(null);
  const companyIdCardRef = useRef<HTMLInputElement>(null);
  const collegeIdCardRef = useRef<HTMLInputElement>(null);
  const submitForm = useSubmitForm();
  const { data: bankDetails, isLoading: isLoadingBankDetails } =
    useGetBankDetails();

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      registration: {
        name: "",
        email: "",
        phone: "",
        department: "",
        graduationYear: BigInt(1995),
        degreeType: DegreeType.UG,
        currentStatus: CurrentStatus.Working,
      },
      curriculum: {
        q1: LikertCurriculum.Good,
        q2: LikertCurriculum.Good,
        q3: LikertCurriculum.Good,
        q4: LikertCurriculum.Good,
        q5: LikertCurriculum.Good,
        q6: LikertCurriculum.Good,
        q7: LikertCurriculum.Good,
        q8: LikertCurriculum.Good,
        suggestions: "",
      },
      teaching: {
        q1: LikertTeaching.good,
        q2: LikertTeaching.good,
        q3: LikertTeaching.good,
        q4: LikertTeaching.good,
        q5: LikertTeaching.good,
        q6: LikertTeaching.good,
        q7: LikertTeaching.good,
        q8: LikertTeaching.good,
        q9: LikertTeaching.good,
        q10: LikertTeaching.good,
        additionalFacilities: "",
        additionalComments: "",
      },
    },
  });

  const degreeType = watch("registration.degreeType") as DegreeType | undefined;
  const currentStatus = watch("registration.currentStatus");
  const departments = getDepartments(degreeType);
  const batches = getBatches(degreeType);

  const handleNext = async () => {
    let valid = false;
    if (currentStep === 1) {
      valid = await trigger([
        "registration.name",
        "registration.email",
        "registration.phone",
        "registration.degreeType",
        "registration.department",
        "registration.graduationYear",
        "registration.currentStatus",
      ]);
    } else if (currentStep === 2) {
      valid = await trigger([
        "curriculum.q1",
        "curriculum.q2",
        "curriculum.q3",
        "curriculum.q4",
        "curriculum.q5",
        "curriculum.q6",
        "curriculum.q7",
        "curriculum.q8",
      ]);
    } else {
      valid = true;
    }
    if (!valid) return;
    setCurrentStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (data: FormData) => {
    // Validate contribution amount only when a payment-required option is selected
    if (needsPayment) {
      const amt = Number(contributionAmount);
      if (
        !contributionAmount ||
        Number.isNaN(amt) ||
        amt < 1 ||
        amt > 100000 ||
        !Number.isInteger(amt)
      ) {
        setContributionAmountError(
          "Please enter a valid amount between ₹1 and ₹1,00,000.",
        );
        return;
      }
      setContributionAmountError("");
      // Store form data and open payment modal
      setPendingFormData(data);
      setShowPaymentModal(true);
      setPaymentStatus("waiting");
      return;
    }
    await doSubmit(data, undefined);
  };

  const doSubmit = async (
    data: FormData,
    contribAmount: number | undefined,
  ) => {
    try {
      let appointmentOrderUrl: string | undefined;
      let companyIdCardUrl: string | undefined;
      let collegeIdCardUrl: string | undefined;

      if (appointmentOrderFile) {
        setUploadingFiles(true);
        try {
          appointmentOrderUrl = await fileToDataUrl(appointmentOrderFile);
        } catch {
          toast.warning("Could not read appointment order file.");
        }
      }

      if (companyIdCardFile) {
        setUploadingFiles(true);
        try {
          companyIdCardUrl = await fileToDataUrl(companyIdCardFile);
        } catch {
          toast.warning("Could not read company ID card file.");
        }
      }

      if (collegeIdCardFile) {
        setUploadingFiles(true);
        try {
          collegeIdCardUrl = await fileToDataUrl(collegeIdCardFile);
        } catch {
          toast.warning("Could not read college ID card file.");
        }
      }

      setUploadingFiles(false);

      const input: SubmitFormInput = {
        registration: {
          ...data.registration,
          graduationYear: BigInt(data.registration.graduationYear),
          appointmentOrder: appointmentOrderUrl,
          companyIdCard: companyIdCardUrl,
          collegeIdCard: collegeIdCardUrl,
        },
        curriculum: data.curriculum,
        teaching: {
          q1: data.teaching.q1,
          q2: data.teaching.q2,
          q3: data.teaching.q3,
          q4: data.teaching.q4,
          q5: data.teaching.q5,
          q6: data.teaching.q6,
          q7: data.teaching.q7,
          q8: data.teaching.q8,
          q9: data.teaching.q9,
          q10: data.teaching.q10,
          additionalFacilities: data.teaching.additionalFacilities,
          additionalComments: data.teaching.additionalComments,
        },
        contributionAmount:
          contribAmount !== undefined ? BigInt(contribAmount) : undefined,
      };
      const id = await submitForm.mutateAsync(input);
      setSubmittedId(id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setUploadingFiles(false);
      toast.error("Failed to submit feedback. Please try again.");
    }
  };

  const handlePaymentSuccess = async () => {
    if (!pendingFormData) return;
    const amt = Number(contributionAmount);
    setPaymentStatus("verified");
    setShowPaymentModal(false);
    await doSubmit(pendingFormData, amt);
    setPaymentSuccessful(true);
    setPendingFormData(null);
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    // Keep paymentStatus as 'waiting' so the banner shows
    setPaymentStatus("waiting");
    setPaymentError(
      "Payment was cancelled. Please complete payment to submit.",
    );
  };

  const handleCopyId = () => {
    if (submittedId !== null) {
      navigator.clipboard.writeText(submittedId.toString()).then(() => {
        toast.success("Submission ID copied to clipboard");
      });
    }
  };

  const handleReset = () => {
    setSubmittedId(null);
    setCurrentStep(1);
    setAppointmentOrderFile(null);
    setCompanyIdCardFile(null);
    setCollegeIdCardFile(null);
    setContributionOption(null);
    setContributionAmount("");
    setContributionAmountError("");
    setPaymentError("");
    setPaymentSuccessful(false);
    setPaymentStatus("idle");
    setPendingFormData(null);
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submittedId !== null) {
    return (
      <PublicLayout>
        <div className="w-full max-w-xl py-10" data-ocid="form.success_state">
          <div className="form-card text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-accent" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-foreground">
                Thank You!
              </h2>
              <p className="text-muted-foreground text-sm">
                Your feedback has been submitted successfully. Your insights
                help us improve our programs and curriculum.
              </p>
            </div>

            {/* Payment success banner — only if a contribution was made */}
            {paymentSuccessful && (
              <div
                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3"
                data-ocid="form.payment_success_state"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-green-700">
                    Payment Successful
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Your contribution of ₹{contributionAmount} has been
                    recorded. Thank you for your generosity!
                  </p>
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg border border-border p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Your Submission ID
              </p>
              <div className="flex items-center justify-center gap-2">
                <span
                  className="font-mono text-lg font-bold text-primary"
                  data-ocid="form.submission_id"
                >
                  #{submittedId.toString()}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1.5 rounded-md hover:bg-muted transition-smooth text-muted-foreground hover:text-foreground"
                  aria-label="Copy submission ID"
                  data-ocid="form.copy_id_button"
                >
                  <ClipboardCopy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Please keep this for your records
              </p>
            </div>

            <div className="bg-secondary/20 rounded-lg p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                What happens next?
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Your feedback is reviewed by the IQAC committee</li>
                <li>Actions are planned based on alumni insights</li>
                <li>Improvements are implemented in upcoming sessions</li>
              </ul>
            </div>

            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full"
              data-ocid="form.submit_another_button"
            >
              Submit Another Response
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // ── Multi-step form ─────────────────────────────────────────────────────────
  return (
    <PublicLayout>
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Alumni Feedback Form
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Help us improve by sharing your experience
          </p>
        </div>

        <div className="form-card" data-ocid="form.step_indicator_card">
          <StepIndicator steps={FORM_STEPS} currentStep={currentStep} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* ── Step 1: Registration ─────────────────────────────────────── */}
          {currentStep === 1 && (
            <div
              className="form-card space-y-5"
              data-ocid="form.registration_section"
            >
              <div className="flex items-center gap-3 pb-1">
                <Badge variant="secondary" className="text-xs font-bold">
                  Step 1 of 3
                </Badge>
                <h3 className="font-display font-semibold text-lg text-foreground">
                  Registration Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    {...register("registration.name", {
                      required: "Name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    })}
                    data-ocid="form.name_input"
                  />
                  {errors.registration?.name && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="form.name.field_error"
                    >
                      {errors.registration.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("registration.email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email address",
                      },
                    })}
                    data-ocid="form.email_input"
                  />
                  {errors.registration?.email && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="form.email.field_error"
                    >
                      {errors.registration.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    {...register("registration.phone", {
                      required: "Phone is required",
                      pattern: {
                        value: /^[0-9+\-\s()]{10,15}$/,
                        message: "Enter a valid 10–15 digit phone number",
                      },
                    })}
                    data-ocid="form.phone_input"
                  />
                  {errors.registration?.phone && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="form.phone.field_error"
                    >
                      {errors.registration.phone.message}
                    </p>
                  )}
                </div>

                {/* Batch */}
                <div className="space-y-1.5">
                  <Label>
                    Batch <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="registration.graduationYear"
                    control={control}
                    rules={{ required: "Batch is required" }}
                    render={({ field }) => (
                      <Select
                        value={field.value.toString()}
                        onValueChange={(v) => field.onChange(BigInt(v))}
                      >
                        <SelectTrigger data-ocid="form.batch_select">
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                        <SelectContent>
                          {batches.map((batch) => {
                            const startYear = Number.parseInt(
                              batch.split("-")[0],
                              10,
                            );
                            return (
                              <SelectItem
                                key={batch}
                                value={startYear.toString()}
                              >
                                {batch}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.registration?.graduationYear && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="form.batch.field_error"
                    >
                      {errors.registration.graduationYear.message}
                    </p>
                  )}
                </div>

                {/* Degree Type */}
                <div className="space-y-1.5">
                  <Label>
                    Degree Type <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="registration.degreeType"
                    control={control}
                    rules={{ required: "Degree type is required" }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger data-ocid="form.degree_type_select">
                          <SelectValue placeholder="Select degree" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={DegreeType.UG}>
                            UG (Under Graduate)
                          </SelectItem>
                          <SelectItem value={DegreeType.PG}>
                            PG (Post Graduate)
                          </SelectItem>
                          <SelectItem value={DegreeType.MPhil}>
                            M.Phil
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <Label>
                    Department <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="registration.department"
                    control={control}
                    rules={{ required: "Department is required" }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger data-ocid="form.department_select">
                          <SelectValue
                            placeholder={
                              degreeType
                                ? "Select department"
                                : "Select degree type first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.registration?.department && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="form.department.field_error"
                    >
                      {errors.registration.department.message}
                    </p>
                  )}
                </div>

                {/* Current Status */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>
                    Current Status <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="registration.currentStatus"
                    control={control}
                    rules={{ required: "Current status is required" }}
                    render={({ field }) => (
                      <div
                        className="flex flex-wrap gap-2"
                        role="radiogroup"
                        aria-label="Current status"
                      >
                        {(
                          [
                            {
                              value: CurrentStatus.Working,
                              label: "Working",
                              desc: "Employed / Self-employed",
                            },
                            {
                              value: CurrentStatus.Studying,
                              label: "Studying",
                              desc: "Pursuing higher education",
                            },
                            {
                              value: CurrentStatus.Other,
                              label: "Other",
                              desc: "Other occupation",
                            },
                          ] as const
                        ).map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex flex-col gap-0.5 px-4 py-2.5 rounded-md border cursor-pointer text-sm transition-smooth select-none flex-1 min-w-[120px] ${
                              field.value === opt.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50"
                            }`}
                            data-ocid={`form.status.${opt.value.toLowerCase()}_radio`}
                          >
                            <input
                              type="radio"
                              name="currentStatus"
                              value={opt.value}
                              checked={field.value === opt.value}
                              onChange={() => field.onChange(opt.value)}
                              className="sr-only"
                            />
                            <span className="font-semibold">{opt.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {opt.desc}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  />
                </div>

                {/* Conditional: Working */}
                {currentStatus === CurrentStatus.Working && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="designation">Designation</Label>
                      <Input
                        id="designation"
                        placeholder="e.g. Software Engineer"
                        {...register("registration.designation")}
                        data-ocid="form.designation_input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="company">Company / Organisation</Label>
                      <Input
                        id="company"
                        placeholder="e.g. TCS, Infosys"
                        {...register("registration.company")}
                        data-ocid="form.company_input"
                      />
                    </div>

                    {/* Company Address */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="companyAddress">
                        Company Address{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="companyAddress"
                        placeholder="Enter full company / organisation address"
                        rows={3}
                        {...register("registration.companyAddress", {
                          required: "Company address is required",
                        })}
                        data-ocid="form.company_address_textarea"
                      />
                      {errors.registration?.companyAddress && (
                        <p
                          className="text-destructive text-xs"
                          data-ocid="form.company_address.field_error"
                        >
                          {errors.registration.companyAddress.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>
                        Appointment Order
                        <span className="text-muted-foreground font-normal ml-1 text-xs">
                          (optional)
                        </span>
                      </Label>
                      <input
                        ref={appointmentOrderRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setAppointmentOrderFile(file);
                        }}
                      />
                      <div className="flex items-center gap-3 p-3 border border-dashed border-border rounded-md bg-muted/20">
                        {appointmentOrderFile ? (
                          <>
                            <FileText className="w-5 h-5 text-primary shrink-0" />
                            <span className="flex-1 min-w-0 text-sm text-foreground truncate">
                              {appointmentOrderFile.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAppointmentOrderFile(null);
                                if (appointmentOrderRef.current)
                                  appointmentOrderRef.current.value = "";
                              }}
                              className="shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remove appointment order file"
                              data-ocid="form.appointment_order_remove_button"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-muted-foreground">
                                Accepted formats: JPG, PNG, PDF
                              </p>
                            </div>
                            <button
                              type="button"
                              className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
                              onClick={() =>
                                appointmentOrderRef.current?.click()
                              }
                              data-ocid="form.appointment_order_upload"
                            >
                              Browse
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Company ID Card Upload */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>
                        Company ID Card
                        <span className="text-muted-foreground font-normal ml-1 text-xs">
                          (optional)
                        </span>
                      </Label>
                      <input
                        ref={companyIdCardRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setCompanyIdCardFile(file);
                        }}
                      />
                      <div className="flex items-center gap-3 p-3 border border-dashed border-border rounded-md bg-muted/20">
                        {companyIdCardFile ? (
                          <>
                            <FileText className="w-5 h-5 text-primary shrink-0" />
                            <span className="flex-1 min-w-0 text-sm text-foreground truncate">
                              {companyIdCardFile.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCompanyIdCardFile(null);
                                if (companyIdCardRef.current)
                                  companyIdCardRef.current.value = "";
                              }}
                              className="shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remove company ID card file"
                              data-ocid="form.company_id_card_remove_button"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-muted-foreground">
                                Accepted formats: JPG, PNG, PDF
                              </p>
                            </div>
                            <button
                              type="button"
                              className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
                              onClick={() => companyIdCardRef.current?.click()}
                              data-ocid="form.company_id_card_upload"
                            >
                              Browse
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Conditional: Studying */}
                {currentStatus === CurrentStatus.Studying && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="college">College / University</Label>
                      <Input
                        id="college"
                        placeholder="e.g. Anna University"
                        {...register("registration.college")}
                        data-ocid="form.college_input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="program">Program Enrolled</Label>
                      <Input
                        id="program"
                        placeholder="e.g. M.Tech CSE"
                        {...register("registration.program")}
                        data-ocid="form.program_input"
                      />
                    </div>

                    {/* College Address */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="collegeAddress">
                        College Address{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="collegeAddress"
                        placeholder="Enter full college / university address"
                        rows={3}
                        {...register("registration.collegeAddress", {
                          required: "College address is required",
                        })}
                        data-ocid="form.college_address_textarea"
                      />
                      {errors.registration?.collegeAddress && (
                        <p
                          className="text-destructive text-xs"
                          data-ocid="form.college_address.field_error"
                        >
                          {errors.registration.collegeAddress.message}
                        </p>
                      )}
                    </div>

                    {/* College ID Card Upload */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>
                        College ID Card
                        <span className="text-muted-foreground font-normal ml-1 text-xs">
                          (optional)
                        </span>
                      </Label>
                      <input
                        ref={collegeIdCardRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setCollegeIdCardFile(file);
                        }}
                      />
                      <div className="flex items-center gap-3 p-3 border border-dashed border-border rounded-md bg-muted/20">
                        {collegeIdCardFile ? (
                          <>
                            <FileText className="w-5 h-5 text-primary shrink-0" />
                            <span className="flex-1 min-w-0 text-sm text-foreground truncate">
                              {collegeIdCardFile.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCollegeIdCardFile(null);
                                if (collegeIdCardRef.current)
                                  collegeIdCardRef.current.value = "";
                              }}
                              className="shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remove college ID card file"
                              data-ocid="form.college_id_card_remove_button"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-muted-foreground">
                                Accepted formats: JPG, PNG, PDF
                              </p>
                            </div>
                            <button
                              type="button"
                              className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
                              onClick={() => collegeIdCardRef.current?.click()}
                              data-ocid="form.college_id_card_upload"
                            >
                              Browse
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Conditional: Other */}
                {currentStatus === CurrentStatus.Other && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="occupation">
                      Occupation <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="occupation"
                      placeholder="Enter your occupation"
                      {...register("registration.occupation", {
                        required: "Occupation is required",
                      })}
                      data-ocid="form.occupation_input"
                    />
                    {errors.registration?.occupation && (
                      <p
                        className="text-destructive text-xs"
                        data-ocid="form.occupation.field_error"
                      >
                        {errors.registration.occupation.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleNext}
                  data-ocid="form.next_button"
                >
                  Next: Curriculum Feedback →
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Curriculum Feedback ──────────────────────────────── */}
          {currentStep === 2 && (
            <div
              className="form-card space-y-6"
              data-ocid="form.curriculum_section"
            >
              <div className="flex items-center gap-3 pb-1">
                <Badge variant="secondary" className="text-xs font-bold">
                  Step 2 of 3
                </Badge>
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    Curriculum Feedback
                  </h3>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Rate each aspect of the curriculum.
                  </p>
                </div>
              </div>

              {CURRICULUM_QUESTIONS.map((question, index) => {
                const key = `q${index + 1}` as keyof Omit<
                  CurriculumFeedback,
                  "suggestions"
                >;
                const fieldName = `curriculum.${key}` as
                  | "curriculum.q1"
                  | "curriculum.q2"
                  | "curriculum.q3"
                  | "curriculum.q4"
                  | "curriculum.q5"
                  | "curriculum.q6"
                  | "curriculum.q7"
                  | "curriculum.q8";
                return (
                  <div
                    key={key}
                    className="space-y-2 pb-5 border-b border-border last:border-0 last:pb-0"
                    data-ocid={`form.curriculum.question.${index + 1}`}
                  >
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold mr-2 shrink-0">
                        {index + 1}
                      </span>
                      {question}
                    </p>
                    <Controller
                      name={fieldName}
                      control={control}
                      rules={{ required: "Please select a rating" }}
                      render={({ field, fieldState }) => (
                        <LikertScale
                          options={LIKERT_CURRICULUM_OPTIONS}
                          value={field.value as LikertCurriculum}
                          onChange={field.onChange}
                          name={`curriculum.${key}`}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>
                );
              })}

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="suggestions">
                  Suggestions for Curriculum Improvement
                  <span className="text-muted-foreground font-normal ml-1 text-xs">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="suggestions"
                  placeholder="Share your suggestions for curriculum improvement — topics, skills, practical components, etc."
                  rows={4}
                  {...register("curriculum.suggestions")}
                  data-ocid="form.curriculum.suggestions_textarea"
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  data-ocid="form.back_button"
                >
                  ← Back
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  data-ocid="form.next_button"
                >
                  Next: Teaching Feedback →
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Teaching & Learning ──────────────────────────────── */}
          {currentStep === 3 && (
            <div
              className="form-card space-y-6"
              data-ocid="form.teaching_section"
            >
              <div className="flex items-center gap-3 pb-1">
                <Badge variant="secondary" className="text-xs font-bold">
                  Step 3 of 3
                </Badge>
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    Teaching & Learning Feedback
                  </h3>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Rate the quality of teaching and learning.
                  </p>
                </div>
              </div>

              {/* 10 Likert questions */}
              {TEACHING_QUESTIONS.map((question, index) => {
                const key = `q${index + 1}` as keyof TeachingFormState;
                const fieldName = `teaching.${key}` as
                  | "teaching.q1"
                  | "teaching.q2"
                  | "teaching.q3"
                  | "teaching.q4"
                  | "teaching.q5"
                  | "teaching.q6"
                  | "teaching.q7"
                  | "teaching.q8"
                  | "teaching.q9"
                  | "teaching.q10";
                return (
                  <div
                    key={key}
                    className="space-y-2 pb-5 border-b border-border last:border-0 last:pb-0"
                    data-ocid={`form.teaching.question.${index + 1}`}
                  >
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold mr-2 shrink-0">
                        {index + 1}
                      </span>
                      {question}
                    </p>
                    <Controller
                      name={fieldName}
                      control={control}
                      rules={{ required: "Please select a rating" }}
                      render={({ field, fieldState }) => (
                        <LikertScale
                          options={LIKERT_TEACHING_OPTIONS}
                          value={field.value as LikertTeaching}
                          onChange={field.onChange}
                          name={`teaching.${key}`}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>
                );
              })}

              {/* Text question 11 */}
              <div className="space-y-1.5 pt-2 pb-5 border-b border-border">
                <Label htmlFor="additionalFacilities">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold mr-2 shrink-0">
                    11
                  </span>
                  What additional facilities or support services would improve
                  student experience?
                  <span className="text-muted-foreground font-normal ml-1 text-xs">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="additionalFacilities"
                  placeholder="Share your suggestions..."
                  rows={3}
                  {...register("teaching.additionalFacilities")}
                  data-ocid="form.teaching.additional_facilities_textarea"
                />
              </div>

              {/* Text question 12 */}
              <div className="space-y-1.5">
                <Label htmlFor="additionalComments">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold mr-2 shrink-0">
                    12
                  </span>
                  Any additional comments or suggestions?
                  <span className="text-muted-foreground font-normal ml-1 text-xs">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="additionalComments"
                  placeholder="Any other feedback or suggestions..."
                  rows={3}
                  {...register("teaching.additionalComments")}
                  data-ocid="form.teaching.additional_comments_textarea"
                />
              </div>

              {/* ── Contribution Question ─────────────────────────────── */}
              <div
                className="mt-2 p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-4"
                data-ocid="contribution.section"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm leading-snug">
                      ARE YOU WILLING TO CONTRIBUTE FOR
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select one option. Your contribution supports our
                      community.
                    </p>
                  </div>
                </div>

                {/* Three radio options — single selection only */}
                <fieldset className="space-y-2.5" role="radiogroup">
                  {(
                    [
                      {
                        key: "poor_students",
                        label: "POOR STUDENTS EDUCATION EXPENSES",
                        desc: "Support underprivileged students' educational needs",
                        requiresPayment: true,
                      },
                      {
                        key: "orphanages",
                        label: "ORPHANAGES / OLD AGE HOMES",
                        desc: "Donate to orphanages and old age homes",
                        requiresPayment: true,
                      },
                      {
                        key: "books",
                        label: "Books To Library & Students",
                        desc: "Contribute books to the college library and students",
                        requiresPayment: false,
                      },
                    ] as const
                  ).map((opt) => {
                    const selected = contributionOption === opt.key;
                    return (
                      <label
                        key={opt.key}
                        className={`flex items-start gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer text-sm transition-all select-none ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                        }`}
                        data-ocid={`contribution.${opt.key}_radio`}
                      >
                        <input
                          type="radio"
                          name="contributionOption"
                          value={opt.key}
                          checked={selected}
                          onChange={() => {
                            setContributionOption(opt.key);
                            setContributionAmountError("");
                            setPaymentError("");
                            // If switching away from a payment option, clear amount
                            if (!opt.requiresPayment) {
                              setContributionAmount("");
                              setContributionAmountError("");
                              setPaymentError("");
                            }
                          }}
                          className="mt-0.5 w-4 h-4 accent-primary shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-semibold text-xs leading-snug ${selected ? "text-primary" : "text-foreground"}`}
                          >
                            {opt.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {opt.desc}
                          </p>
                          {opt.requiresPayment && (
                            <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              Payment required
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </fieldset>

                {/* Amount input — only when a payment-required option is selected */}
                {needsPayment && (
                  <div
                    className="space-y-2"
                    data-ocid="contribution.amount_section"
                  >
                    <Label
                      htmlFor="contributionAmount"
                      className="text-sm font-medium"
                    >
                      Enter Contribution Amount (₹){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                        ₹
                      </span>
                      <Input
                        id="contributionAmount"
                        type="number"
                        min={1}
                        max={100000}
                        step={1}
                        placeholder="e.g. 500"
                        value={contributionAmount}
                        onChange={(e) => {
                          setContributionAmount(e.target.value);
                          setContributionAmountError("");
                          setPaymentError("");
                        }}
                        className="pl-8"
                        data-ocid="contribution.amount_input"
                      />
                    </div>
                    {contributionAmountError && (
                      <p
                        className="text-destructive text-xs"
                        data-ocid="contribution.amount.field_error"
                      >
                        {contributionAmountError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Minimum ₹1 · Maximum ₹1,00,000. UPI payment (Google Pay /
                      PhonePe) will open on submit.
                    </p>
                  </div>
                )}

                {/* Waiting for payment banner — shown when modal was dismissed without paying */}
                {paymentStatus === "waiting" && !showPaymentModal && (
                  <div
                    className="flex flex-col gap-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl px-4 py-4"
                    data-ocid="contribution.waiting_payment_state"
                  >
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-yellow-800">
                          Waiting for Payment
                        </p>
                        <p className="text-xs text-yellow-700 mt-0.5">
                          Please complete your payment to submit the form. Your
                          form data is saved.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        data-ocid="contribution.resume_payment_button"
                        className="flex-1 h-9 text-xs font-bold bg-yellow-600 hover:bg-yellow-700 text-white"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        Resume Payment
                      </Button>
                      <button
                        type="button"
                        className="text-xs text-yellow-700 hover:text-yellow-900 underline underline-offset-2 transition-colors px-2"
                        data-ocid="contribution.cancel_contribution_link"
                        onClick={() => {
                          setContributionOption(null);
                          setContributionAmount("");
                          setContributionAmountError("");
                          setPaymentError("");
                          setPaymentStatus("idle");
                          setPendingFormData(null);
                        }}
                      >
                        Cancel Contribution
                      </button>
                    </div>
                  </div>
                )}

                {paymentError && paymentStatus !== "waiting" && (
                  <div
                    className="flex items-start gap-2.5 bg-destructive/5 border border-destructive/25 rounded-lg px-3 py-3"
                    data-ocid="contribution.payment.error_state"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">
                        Payment Cancelled
                      </p>
                      <p className="text-xs text-destructive/80 mt-0.5">
                        Your payment was not completed. You can try again or
                        select a different contribution option.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  data-ocid="form.back_button"
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitForm.isPending || uploadingFiles}
                  data-ocid="form.submit_button"
                >
                  {uploadingFiles
                    ? "Saving files..."
                    : submitForm.isPending
                      ? "Submitting..."
                      : needsPayment
                        ? "Proceed to Payment →"
                        : "Submit Feedback"}
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* Payment Modal */}
        {showPaymentModal && pendingFormData && (
          <ContributionPaymentModal
            open={showPaymentModal}
            onClose={handlePaymentCancel}
            amount={Number(contributionAmount)}
            bankDetails={bankDetails ?? null}
            isLoadingBankDetails={isLoadingBankDetails}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
            selectedOptions={
              contributionOption ? new Set([contributionOption]) : new Set()
            }
          />
        )}
      </div>
    </PublicLayout>
  );
}
