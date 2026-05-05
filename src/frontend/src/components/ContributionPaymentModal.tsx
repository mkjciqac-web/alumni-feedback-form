import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Loader2,
  Smartphone,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import type { BankDetails } from "../types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContributionPaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  bankDetails: BankDetails | null;
  isLoadingBankDetails: boolean;
  /** Called when user confirms payment was completed */
  onPaymentSuccess: () => void;
  /** Called when user cancels without completing payment */
  onCancel: () => void;
  selectedOptions?: Set<string>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OPTION_LABELS: Record<string, string> = {
  poor_students: "Poor Students Education Expenses",
  orphanages: "Orphanages / Old Age Homes",
};

type UpiApp = "gpay" | "phonepe";

const UPI_APPS: { id: UpiApp; label: string; color: string }[] = [
  { id: "gpay", label: "Google Pay", color: "#4285F4" },
  { id: "phonepe", label: "PhonePe", color: "#5F259F" },
];

// 'select' = pick app, 'paying' = app opened / waiting for confirmation
type UpiPayStep = "select" | "paying";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPurposeLines(selected: Set<string>): string[] {
  return (["poor_students", "orphanages"] as const)
    .filter((k) => selected.has(k))
    .map((k) => OPTION_LABELS[k]);
}

export function generateUpiString(
  upiId: string,
  amount: number,
  name: string,
): string {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent("Alumni Contribution")}`;
}

export function buildDeepLink(
  app: UpiApp,
  upiId: string,
  amount: number,
  name: string,
): string {
  const params = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent("Alumni Contribution")}`;
  if (app === "gpay") return `tez://upi/pay?${params}`;
  return `phonepe://pay?${params}`;
}

export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Copy Field ───────────────────────────────────────────────────────────────

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={value}
          className="font-mono text-sm bg-muted/30 border-border"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 p-2 rounded-md border border-border hover:bg-muted transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <ClipboardCopy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Google Pay SVG Icon ──────────────────────────────────────────────────────

export function GooglePayIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Google Pay"
    >
      <title>Google Pay</title>
      <rect
        width="48"
        height="48"
        rx="10"
        fill="white"
        stroke="#E0E0E0"
        strokeWidth="1.5"
      />
      <text
        x="9"
        y="33"
        fontSize="22"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
      >
        <tspan fill="#4285F4">G</tspan>
        <tspan fill="#EA4335">o</tspan>
        <tspan fill="#FBBC05">o</tspan>
        <tspan fill="#34A853">g</tspan>
      </text>
    </svg>
  );
}

// ─── PhonePe SVG Icon ─────────────────────────────────────────────────────────

export function PhonePeIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PhonePe"
    >
      <title>PhonePe</title>
      <rect width="48" height="48" rx="10" fill="#5F259F" />
      <text
        x="10"
        y="33"
        fontSize="18"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        fill="white"
      >
        Pe
      </text>
    </svg>
  );
}

// ─── UPI Content ──────────────────────────────────────────────────────────────

interface UpiContentProps {
  bankDetails: BankDetails;
  amount: number;
  onPaymentDone: () => void;
  onCancelled: () => void;
}

function UpiContent({
  bankDetails,
  amount,
  onPaymentDone,
  onCancelled,
}: UpiContentProps) {
  const [selectedApp, setSelectedApp] = useState<UpiApp>("gpay");
  const [upiStep, setUpiStep] = useState<UpiPayStep>("select");
  const isMobile = isMobileDevice();

  const upiString = generateUpiString(
    bankDetails.upiId,
    amount,
    bankDetails.accountHolderName,
  );

  const appConfig = UPI_APPS.find((a) => a.id === selectedApp)!;

  const handlePayNow = () => {
    const deepLink = buildDeepLink(
      selectedApp,
      bankDetails.upiId,
      amount,
      bankDetails.accountHolderName,
    );
    window.location.href = deepLink;
    if (isMobile) {
      setTimeout(() => {
        const intentParams = `pa=${encodeURIComponent(bankDetails.upiId)}&pn=${encodeURIComponent(bankDetails.accountHolderName)}&am=${amount}&cu=INR&tn=${encodeURIComponent("Alumni Contribution")}`;
        const intentLink =
          selectedApp === "gpay"
            ? `intent://upi/pay?${intentParams}#Intent;scheme=tez;package=com.google.android.apps.nbu.paisa.user;end`
            : `intent://pay?${intentParams}#Intent;scheme=phonepe;package=com.phonepe.app;end`;
        window.location.href = intentLink;
      }, 1500);
    }
    // After attempting to open app, show confirmation step
    setTimeout(() => setUpiStep("paying"), 2000);
  };

  // ── Paying / confirmation step ──────────────────────────────────────────────
  if (upiStep === "paying") {
    return (
      <div className="flex flex-col gap-4 py-2">
        {/* App indicator */}
        <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2.5 border border-border">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: appConfig.color }}
          >
            {selectedApp === "gpay" ? (
              <GooglePayIcon size={28} />
            ) : (
              <PhonePeIcon size={28} />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">
              {appConfig.label} opened
            </p>
            <p className="text-xs text-muted-foreground">
              Complete your payment of{" "}
              <span className="font-bold">{formatINR(amount)}</span> in the app,
              then confirm below
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Did you complete the payment of{" "}
          <span className="font-semibold text-foreground">
            {formatINR(amount)}
          </span>{" "}
          via {appConfig.label}?
        </p>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            data-ocid="contribution.payment_done_button"
            className="w-full h-11 font-bold text-white"
            style={{ background: appConfig.color }}
            onClick={onPaymentDone}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Payment Done
          </Button>
          <Button
            type="button"
            variant="outline"
            data-ocid="contribution.cancel_payment_button"
            className="w-full h-10 text-sm"
            onClick={onCancelled}
          >
            Cancel Payment
          </Button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            onClick={() => setUpiStep("select")}
            data-ocid="contribution.upi_back_button"
          >
            ← Back to payment options
          </button>
        </div>
      </div>
    );
  }

  // ── Select + Pay step ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 border border-border">
        <span className="text-xs text-muted-foreground font-medium">
          Amount:
        </span>
        <span className="text-base font-bold text-foreground">
          {formatINR(amount)}
        </span>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Select UPI App
        </p>
        <div className="flex gap-2">
          {UPI_APPS.map((app) => (
            <button
              key={app.id}
              type="button"
              data-ocid={`contribution.upi_app.${app.id}`}
              onClick={() => setSelectedApp(app.id)}
              className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                selectedApp === app.id
                  ? "border-2 shadow-sm bg-card"
                  : "border-border bg-muted/20 hover:bg-muted/40"
              }`}
              style={
                selectedApp === app.id ? { borderColor: app.color } : undefined
              }
            >
              {app.id === "gpay" ? (
                <GooglePayIcon size={26} />
              ) : (
                <PhonePeIcon size={26} />
              )}
              <span
                className="text-sm font-semibold"
                style={
                  selectedApp === app.id ? { color: app.color } : undefined
                }
              >
                {app.label}
              </span>
              {selectedApp === app.id && (
                <Check
                  className="w-3.5 h-3.5 ml-auto"
                  style={{ color: app.color }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {isMobile ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <Button
            type="button"
            data-ocid="contribution.pay_now_button"
            className="w-full font-bold text-white h-12 text-base"
            style={{ background: appConfig.color }}
            onClick={handlePayNow}
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Pay {formatINR(amount)}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Tap to open {appConfig.label} with the amount pre-filled. After
            paying, confirm below.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground font-medium">
            Scan with {appConfig.label}
          </p>
          <div
            className="p-1.5 rounded-xl inline-block"
            style={{
              background: `linear-gradient(135deg, ${appConfig.color}CC 0%, ${appConfig.color}44 100%)`,
            }}
          >
            <div className="bg-white rounded-lg p-2.5 inline-block">
              <QRCodeSVG
                value={upiString}
                size={148}
                bgColor="#ffffff"
                fgColor={appConfig.color}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-[200px]">
            Open {appConfig.label} → Scan QR or use the UPI ID below
          </p>
          <Button
            type="button"
            data-ocid="contribution.pay_now_button"
            className="w-full font-bold text-white h-11 mt-2"
            style={{ background: appConfig.color }}
            onClick={handlePayNow}
          >
            Pay {formatINR(amount)} via {appConfig.label}
          </Button>
        </div>
      )}

      <CopyField label="UPI ID" value={bankDetails.upiId} />
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function ContributionPaymentModal({
  open,
  onClose,
  amount,
  bankDetails,
  isLoadingBankDetails,
  onPaymentSuccess,
  onCancel,
  selectedOptions = new Set(),
}: ContributionPaymentModalProps) {
  const purposeLines = getPurposeLines(selectedOptions);

  const handlePaymentDone = () => {
    onPaymentSuccess();
  };

  const handleCancelled = () => {
    onCancel();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
      data-ocid="contribution.dialog"
    >
      <DialogContent
        className="max-w-md w-full max-h-[90vh] overflow-hidden p-0 flex flex-col"
        data-ocid="contribution.modal"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              UPI Payment
            </DialogTitle>
          </DialogHeader>

          {/* Amount summary */}
          <div className="mt-3 flex items-center gap-3 bg-muted/40 rounded-lg px-4 py-2.5 border border-border">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Contribution Amount
              </p>
              <p className="text-2xl font-black text-foreground tracking-tight">
                {formatINR(amount)}
              </p>
              {purposeLines.length > 0 && (
                <div className="mt-0.5 space-y-0.5">
                  {purposeLines.map((line) => (
                    <p key={line} className="text-xs text-muted-foreground">
                      • {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoadingBankDetails && (
          <div
            className="flex flex-col items-center gap-3 py-12 text-muted-foreground"
            data-ocid="contribution.loading_state"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Loading payment details...</p>
          </div>
        )}

        {/* Not configured */}
        {!isLoadingBankDetails && !bankDetails && (
          <div
            className="flex flex-col items-center gap-3 py-10 px-6 text-center"
            data-ocid="contribution.error_state"
          >
            <AlertCircle className="w-8 h-8 text-destructive" />
            <div>
              <p className="font-medium text-foreground text-sm">
                Payment is not configured yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please contact the college administration.
              </p>
            </div>
          </div>
        )}

        {/* UPI content */}
        {!isLoadingBankDetails && bankDetails && (
          <div className="flex-1 overflow-y-auto p-5">
            <UpiContent
              bankDetails={bankDetails}
              amount={amount}
              onPaymentDone={handlePaymentDone}
              onCancelled={handleCancelled}
            />
          </div>
        )}

        {/* Footer */}
        {!isLoadingBankDetails && bankDetails && (
          <div className="px-5 py-3 border-t border-border bg-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              Pay via Google Pay or PhonePe, then confirm payment below
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
