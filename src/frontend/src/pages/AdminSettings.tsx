import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, Save, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { BankDetails } from "../backend";
import { AdminLayout } from "../components/Layout";
import { createBackendActorOnce } from "../hooks/use-backend";

const EMPTY: BankDetails = {
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  bankName: "",
  upiId: "",
  uroPayApiKey: "",
};

export function AdminSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BankDetails>(EMPTY);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BankDetails, string>>
  >({});

  const { data: savedDetails, isLoading } = useQuery({
    queryKey: ["bank-details"],
    queryFn: async () => {
      const actor = await createBackendActorOnce();
      return actor.getBankDetails();
    },
    throwOnError: false,
  });

  useEffect(() => {
    if (savedDetails != null) {
      setForm(savedDetails);
    }
  }, [savedDetails]);

  const mutation = useMutation({
    mutationFn: async (details: BankDetails) => {
      const actor = await createBackendActorOnce();
      return actor.setBankDetails(details);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-details"] });
      toast.success("Payment settings saved successfully.");
    },
    onError: () => {
      toast.error("Failed to save payment settings. Please try again.");
    },
  });

  function validate(): boolean {
    const newErrors: Partial<Record<keyof BankDetails, string>> = {};
    if (!form.accountHolderName.trim())
      newErrors.accountHolderName = "Account holder name is required.";
    if (!form.accountNumber.trim())
      newErrors.accountNumber = "Account number is required.";
    if (!form.ifscCode.trim()) newErrors.ifscCode = "IFSC code is required.";
    if (!form.bankName.trim()) newErrors.bankName = "Bank name is required.";
    if (!form.upiId.trim()) newErrors.upiId = "UPI ID is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(field: keyof BankDetails, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: field === "ifscCode" ? value.toUpperCase() : value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(form);
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">
            UPI Payment Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure bank account and UPI details shown to alumni during
            contribution payment.
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 mb-6">
          <Smartphone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">
              UPI &amp; Bank Account Details
            </p>
            <p className="text-sm text-muted-foreground">
              These details are displayed to alumni in the payment screen when
              they choose to make a contribution via Google Pay or PhonePe.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4" data-ocid="settings.loading_state">
            {["sk1", "sk2", "sk3", "sk4", "sk5"].map((sk) => (
              <div
                key={sk}
                className="h-10 bg-muted animate-pulse rounded-md"
              />
            ))}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            data-ocid="settings.form"
          >
            {/* UPI ID — first and prominent */}
            <div className="space-y-1.5">
              <Label
                htmlFor="upiId"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <span className="text-xs font-bold px-1.5 py-0.5 rounded text-white bg-primary">
                  UPI
                </span>
                UPI ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="upiId"
                placeholder="e.g. college@sbi"
                value={form.upiId}
                onChange={(e) => handleChange("upiId", e.target.value)}
                data-ocid="settings.upiId.input"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                This UPI ID is used to generate the QR code shown to alumni.
              </p>
              {errors.upiId && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="settings.upiId.field_error"
                >
                  {errors.upiId}
                </p>
              )}
            </div>

            {/* Account Holder Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="accountHolderName"
                className="text-sm font-medium"
              >
                Account Holder Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountHolderName"
                placeholder="e.g. Marudhar Kesari Jain College"
                value={form.accountHolderName}
                onChange={(e) =>
                  handleChange("accountHolderName", e.target.value)
                }
                data-ocid="settings.accountHolderName.input"
              />
              {errors.accountHolderName && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="settings.accountHolderName.field_error"
                >
                  {errors.accountHolderName}
                </p>
              )}
            </div>

            {/* Bank Name */}
            <div className="space-y-1.5">
              <Label htmlFor="bankName" className="text-sm font-medium">
                Bank Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bankName"
                placeholder="e.g. State Bank of India"
                value={form.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
                data-ocid="settings.bankName.input"
              />
              {errors.bankName && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="settings.bankName.field_error"
                >
                  {errors.bankName}
                </p>
              )}
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <Label htmlFor="accountNumber" className="text-sm font-medium">
                Account Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountNumber"
                placeholder="e.g. 12345678901234"
                value={form.accountNumber}
                onChange={(e) => handleChange("accountNumber", e.target.value)}
                data-ocid="settings.accountNumber.input"
              />
              {errors.accountNumber && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="settings.accountNumber.field_error"
                >
                  {errors.accountNumber}
                </p>
              )}
            </div>

            {/* IFSC Code */}
            <div className="space-y-1.5">
              <Label htmlFor="ifscCode" className="text-sm font-medium">
                IFSC Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ifscCode"
                placeholder="e.g. SBIN0001234"
                value={form.ifscCode}
                onChange={(e) => handleChange("ifscCode", e.target.value)}
                data-ocid="settings.ifscCode.input"
                className="font-mono uppercase"
              />
              {errors.ifscCode && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="settings.ifscCode.field_error"
                >
                  {errors.ifscCode}
                </p>
              )}
            </div>

            {/* Save button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="gap-2"
                data-ocid="settings.save_button"
              >
                <Save className="w-4 h-4" />
                {mutation.isPending ? "Saving…" : "Save Payment Settings"}
              </Button>
            </div>

            {mutation.isSuccess && (
              <p
                className="text-sm text-emerald-600 font-medium"
                data-ocid="settings.success_state"
              >
                ✓ Payment settings saved successfully.
              </p>
            )}
            {mutation.isError && (
              <p
                className="text-sm text-destructive"
                data-ocid="settings.error_state"
              >
                Failed to save payment settings. Please try again.
              </p>
            )}
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
