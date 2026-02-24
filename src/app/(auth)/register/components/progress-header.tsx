import { Check } from 'lucide-react'

const STEPS = [
  { label: 'Your Details' },
  { label: 'Review' },
  { label: 'Complete' },
]

interface ProgressHeaderProps {
  currentStep: number
  totalSteps?: number
}

export function ProgressHeader({ currentStep }: ProgressHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Horizontal step groups */}
      <div className="flex gap-2">
        {STEPS.map((step, i) => {
          const stepNum = i + 1
          const isActive = currentStep === stepNum
          const isCompleted = currentStep > stepNum

          return (
            <div key={step.label} className="flex-1">
              {/* Progress bar segment */}
              <div className={`mb-3 h-1 rounded-full transition-colors duration-300 ${
                isCompleted || isActive
                  ? 'bg-primary'
                  : 'bg-muted'
              }`} />

              {/* Step label */}
              <div className="space-y-0.5">
                <p className={`text-xs font-semibold ${
                  isActive ? 'text-foreground' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {stepNum}. {step.label}
                </p>
                <p className={`text-[11px] ${
                  isCompleted
                    ? 'text-primary font-medium'
                    : isActive
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Complete
                    </span>
                  ) : isActive ? (
                    'In Progress'
                  ) : (
                    'Not started'
                  )}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current step detail */}
      <div className="flex items-baseline justify-between border-t border-border/40 pt-3">
        <p className="text-xs text-muted-foreground">
          Step {currentStep} of 3
        </p>
      </div>
    </div>
  )
}
