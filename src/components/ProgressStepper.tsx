import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type ProgressStepperProps = {
  steps: string[];
  currentStep: number;
};

export function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        return (
          <li
            key={step}
            className={cn(
              "flex min-h-14 items-center gap-3 rounded-md border bg-white/80 px-3 py-2 text-sm font-semibold",
              active && "border-primary text-primary shadow-sm",
              done && "border-accent bg-accent/10 text-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs",
                active && "bg-primary text-primary-foreground",
                done && "bg-accent text-accent-foreground"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
