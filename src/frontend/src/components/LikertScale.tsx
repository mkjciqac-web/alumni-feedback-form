import { cn } from "@/lib/utils";

interface LikertOption<T extends string> {
  value: T;
  label: string;
}

interface LikertScaleProps<T extends string> {
  options: LikertOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  name: string;
  error?: string;
}

export function LikertScale<T extends string>({
  options,
  value,
  onChange,
  name,
  error,
}: LikertScaleProps<T>) {
  return (
    <div className="space-y-1">
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-required="true"
      >
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm font-medium transition-smooth select-none",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-smooth",
                  isSelected ? "border-primary" : "border-muted-foreground/50",
                )}
              >
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </span>
              {opt.label}
            </label>
          );
        })}
      </div>
      {error && (
        <p
          className="text-destructive text-xs mt-1"
          data-ocid={`${name}.field_error`}
        >
          {error}
        </p>
      )}
    </div>
  );
}
