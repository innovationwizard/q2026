'use client'

import { Phase } from '@/types/database'

interface PhaseNavProps {
  phases:          Phase[]
  selectedPhaseId: string | null
  onSelect:        (phaseId: string | null) => void
}

export default function PhaseNav({ phases, selectedPhaseId, onSelect }: PhaseNavProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
          selectedPhaseId === null
            ? 'bg-ev26-purple/15 border-ev26-purple/40 text-ui-textMain'
            : 'border-white/10 text-ui-textMuted hover:text-ui-textMain hover:border-white/20'
        }`}
      >
        Todos
      </button>

      {phases.map((phase) => (
        <button
          key={phase.id}
          onClick={() => onSelect(phase.id)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            selectedPhaseId === phase.id
              ? 'bg-ev26-purple/15 border-ev26-purple/40 text-ui-textMain'
              : 'border-white/10 text-ui-textMuted hover:text-ui-textMain hover:border-white/20'
          }`}
        >
          {phase.name_es}
        </button>
      ))}
    </div>
  )
}
