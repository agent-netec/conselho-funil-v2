'use client';

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function FollowUpSuggestions({ suggestions, onSelect }: FollowUpSuggestionsProps) {
  if (suggestions.length === 0) return null;

  const visible = suggestions.slice(0, 3);

  return (
    <div className="border-t border-white/[0.06] mt-3 pt-3">
      <div className="flex flex-wrap gap-2">
        {visible.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(suggestion)}
            className="text-sm px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-[#E6B447]/10 hover:border-[#E6B447]/30 text-zinc-400 hover:text-[#E6B447] transition-all cursor-pointer text-left"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
