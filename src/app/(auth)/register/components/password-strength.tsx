import { Check, Circle } from 'lucide-react'

interface PasswordStrengthProps {
  password: string
}

const requirements = [
  { label: 'At least 10 characters', test: (p: string) => p.length >= 10 },
  { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
  { label: 'Contains special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

function getStrength(password: string): number {
  if (!password) return 0
  return requirements.filter((r) => r.test(password)).length
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent']
const strengthColors = ['', 'bg-destructive', 'bg-warning', 'bg-primary', 'bg-primary', 'bg-success']

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = getStrength(password)

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                level <= strength ? strengthColors[strength] : 'bg-muted'
              }`}
            />
          ))}
        </div>
        {password && (
          <p className={`text-xs font-medium ${
            strength <= 1 ? 'text-destructive' : strength <= 2 ? 'text-warning' : 'text-success'
          }`}>
            {strengthLabels[strength]}
          </p>
        )}
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        {requirements.map((req) => {
          const met = req.test(password)
          return (
            <div key={req.label} className="flex items-center gap-2">
              {met ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
              )}
              <span className={`text-xs ${met ? 'text-success' : 'text-muted-foreground'}`}>
                {req.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
