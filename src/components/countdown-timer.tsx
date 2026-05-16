'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  cutoffAt: string
  onExpired?: () => void
}

function formatDuration(ms: number): { label: string; urgency: 'normal' | 'warning' | 'critical' | 'expired' } {
  if (ms <= 0) return { label: 'Cerrado', urgency: 'expired' }

  const totalSeconds = Math.floor(ms / 1000)
  const hours        = Math.floor(totalSeconds / 3600)
  const minutes      = Math.floor((totalSeconds % 3600) / 60)
  const seconds      = totalSeconds % 60

  let label: string
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    label = `${days}d ${hours % 24}h`
  } else if (hours > 0) {
    label = `${hours}h ${String(minutes).padStart(2, '0')}m`
  } else {
    label = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const urgency = ms < 30 * 60 * 1000 ? 'critical' : ms < 2 * 60 * 60 * 1000 ? 'warning' : 'normal'
  return { label, urgency }
}

export default function CountdownTimer({ cutoffAt, onExpired }: CountdownTimerProps) {
  const [ms, setMs] = useState(() => new Date(cutoffAt).getTime() - Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = new Date(cutoffAt).getTime() - Date.now()
      setMs(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        onExpired?.()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [cutoffAt, onExpired])

  const { label, urgency } = formatDuration(ms)

  const colorClass =
    urgency === 'expired'  ? 'text-ui-textMuted' :
    urgency === 'critical' ? 'text-ui-cta animate-pulse' :
    urgency === 'warning'  ? 'text-ev26-cyan' :
                             'text-ui-textMuted'

  return (
    <span className={`font-mono text-xs font-medium tabular-nums ${colorClass}`}>
      {urgency === 'expired' ? '🔒 Cerrado' : `⏱ ${label}`}
    </span>
  )
}
