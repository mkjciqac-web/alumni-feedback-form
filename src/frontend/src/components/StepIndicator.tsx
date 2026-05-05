import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface Step {
  id: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full" data-ocid="form.step_indicator">
      {/* Step labels row */}
      <div className="flex items-center justify-between mb-3">
        {steps.map((step, index) => {
          const isComplete = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-smooth",
                    isComplete && "bg-primary text-primary-foreground",
                    isCurrent &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isComplete &&
                      !isCurrent &&
                      "bg-muted text-muted-foreground",
                  )}
                  data-ocid={`form.step_indicator.step.${step.id}`}
                >
                  {isComplete ? <CheckIcon className="w-4 h-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isCurrent && "text-primary",
                    isComplete && "text-foreground",
                    !isComplete && !isCurrent && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mt-[-16px]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-smooth",
                      step.id < currentStep ? "bg-primary" : "bg-border",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Progress bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
        />
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckIcon className="w-3 h-3 text-primary" />
          Complete
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          Current
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />
          Upcoming
        </span>
      </div>
    </div>
  );
}
