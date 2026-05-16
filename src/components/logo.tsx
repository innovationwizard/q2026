import { Trophy } from 'lucide-react'

interface LogoProps {
  size?: number
}

export function Logo({ size = 28 }: LogoProps) {
  return <Trophy size={size} style={{ color: '#FFD700' }} strokeWidth={1.75} />
}
