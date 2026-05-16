export type TournamentStatus = 'registration' | 'active' | 'completed'
export type PaymentStatus    = 'pending' | 'confirmed' | 'refunded'
export type MatchStatus      = 'scheduled' | 'live' | 'half_time' | 'completed' | 'postponed' | 'cancelled'
export type BonusType        = 'champion' | 'finalist_1' | 'finalist_2'
export type PhaseEpoch       = 'group' | 'knockout'
export type UserRole         = 'participant' | 'admin'

export interface User {
  id:           string
  email:        string
  full_name:    string
  avatar_url:   string | null
  microsoft_id: string | null
  role:         UserRole
  phone:        string | null
  created_at:   string
}

export interface Tournament {
  id:                    string
  name:                  string
  slug:                  string
  entry_fee_gtq:         number
  status:                TournamentStatus
  registration_deadline: string
  refund_deadline:       string
  starts_at:             string
  ends_at:               string | null
  created_at:            string
}

export interface Enrollment {
  id:                   string
  user_id:              string
  tournament_id:        string
  payment_status:       PaymentStatus
  payment_confirmed_at: string | null
  payment_confirmed_by: string | null
  refunded_at:          string | null
  registered_at:        string
}

export interface Team {
  id:           string
  name:         string
  code:         string
  group_letter: string | null
  ranking: number | null
  flag_url:     string | null
}

export interface Phase {
  id:               string
  name_en:          string
  name_es:          string
  slug:             string
  sort_order:       number
  match_count:      number
  fibonacci_factor: number
  epoch:            PhaseEpoch
  created_at:       string
}

export interface Match {
  id:                    string
  external_id:           string | null
  phase_id:              string
  home_team_id:          string | null
  away_team_id:          string | null
  home_team_placeholder: string | null
  away_team_placeholder: string | null
  kickoff_at:            string
  prediction_cutoff_at:  string
  home_score_result:     number | null
  away_score_result:     number | null
  home_score_pen:        number | null
  away_score_pen:        number | null
  status:                MatchStatus
  api_last_synced_at:    string | null
  created_at:            string
  updated_at:            string
}

export interface Prediction {
  id:         string
  user_id:    string
  match_id:   string
  home_score: number
  away_score: number
  created_at: string
  updated_at: string
}

export interface BonusPrediction {
  id:              string
  user_id:         string
  tournament_id:   string
  prediction_type: BonusType
  team_id:         string
  created_at:      string
}

export interface MatchScore {
  id:             string
  user_id:        string
  match_id:       string
  correct_winner: boolean
  correct_draw:   boolean
  correct_exact:  boolean
  base_points:    number
  phase_factor:   number
  total_points:   number
  computed_at:    string
}

export interface LeaderboardEntry {
  id:                    string
  user_id:               string
  tournament_id:         string
  match_points:          number
  bonus_points:          number
  grand_total:           number
  exact_result_count:    number
  knockout_points:       number
  correct_outcome_count: number
  registered_at:         string
  rank:                  number | null
  previous_rank:         number | null
  updated_at:            string
}

// Joined types used by the UI
export interface MatchWithTeams extends Match {
  home_team: Team | null
  away_team: Team | null
  phase:     Phase
}

export interface MatchWithPrediction extends MatchWithTeams {
  prediction: Prediction | null
  score:      MatchScore | null
}

export interface LeaderboardEntryWithUser extends LeaderboardEntry {
  user: Pick<User, 'id' | 'full_name' | 'avatar_url'>
}

export interface EnrollmentWithUser extends Enrollment {
  user: Pick<User, 'id' | 'email' | 'full_name' | 'phone'>
}
