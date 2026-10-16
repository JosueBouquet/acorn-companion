interface Props {
  step1: string | null
  step2: string | null
  step3?: string | null
  isLoading: boolean
  showStep1: boolean
}

export function AnswerDisplay({ step1, step2, step3, isLoading, showStep1 }: Props) {
  if (isLoading && !step1) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-16 rounded-xl bg-gray-800" />
        <div className="h-12 rounded-xl bg-gray-800 w-3/4" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {step1 && (showStep1 || !step2) && (
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
          <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider mb-1.5">Acorn says...</p>
          <p className="text-base text-emerald-300 font-medium leading-relaxed">{step1}</p>
        </div>
      )}

      {step2 && (
        <div className="p-4 rounded-xl bg-gray-900 border border-emerald-900/40">
          {showStep1 && (
            <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider mb-1.5">
              Espera, en realidad es...
            </p>
          )}
          <p className="text-base text-emerald-100 leading-relaxed">{step2}</p>
        </div>
      )}

      {step3 && (
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
          <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider mb-1.5">Ejemplo</p>
          <p className="text-base text-emerald-200/90 italic leading-relaxed">{step3}</p>
        </div>
      )}
    </div>
  )
}
