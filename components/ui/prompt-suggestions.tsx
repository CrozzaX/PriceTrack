interface PromptSuggestionsProps {
  label: string
  append: (message: { role: "user"; content: string }) => void
  suggestions: string[]
}

export function PromptSuggestions({
  label,
  append,
  suggestions,
}: PromptSuggestionsProps) {
  return (
    <div className="space-y-4 py-4 px-4">
      <h2 className="text-center text-xl font-semibold text-slate-900">{label}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => append({ role: "user", content: suggestion })}
            className="h-max rounded-xl border border-slate-200 bg-white p-4 text-center hover:bg-slate-50 transition-colors duration-200"
          >
            <p className="text-slate-700 text-sm">{suggestion}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
