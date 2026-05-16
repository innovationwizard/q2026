-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE tournament_status AS ENUM ('registration', 'active', 'completed');
CREATE TYPE payment_status    AS ENUM ('pending', 'confirmed', 'refunded');
CREATE TYPE match_status      AS ENUM ('scheduled', 'live', 'half_time', 'completed', 'postponed', 'cancelled');
CREATE TYPE bonus_type        AS ENUM ('champion', 'finalist_1', 'finalist_2');
CREATE TYPE phase_epoch       AS ENUM ('group', 'knockout');
CREATE TYPE user_role         AS ENUM ('participant', 'admin');

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT NOT NULL,
  avatar_url   TEXT,
  microsoft_id TEXT UNIQUE,
  role         user_role NOT NULL DEFAULT 'participant',
  phone        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tournaments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT UNIQUE NOT NULL,
  entry_fee_gtq         NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  status                tournament_status NOT NULL DEFAULT 'registration',
  registration_deadline TIMESTAMPTZ NOT NULL,
  refund_deadline       TIMESTAMPTZ NOT NULL,
  starts_at             TIMESTAMPTZ NOT NULL,
  ends_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE enrollments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id),
  tournament_id        UUID NOT NULL REFERENCES tournaments(id),
  payment_status       payment_status NOT NULL DEFAULT 'pending',
  payment_confirmed_at TIMESTAMPTZ,
  payment_confirmed_by UUID REFERENCES users(id),
  refunded_at          TIMESTAMPTZ,
  registered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tournament_id)
);

CREATE TABLE teams (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  code         CHAR(3) UNIQUE NOT NULL,
  group_letter CHAR(1),
  ranking      INT,
  flag_url     TEXT
);

CREATE TABLE phases (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en          TEXT NOT NULL,
  name_es          TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  sort_order       INT NOT NULL,
  match_count      INT NOT NULL,
  fibonacci_factor NUMERIC(4,1) NOT NULL DEFAULT 1.0,
  epoch            phase_epoch NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE matches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id           TEXT UNIQUE,
  phase_id              UUID NOT NULL REFERENCES phases(id),
  home_team_id          UUID REFERENCES teams(id),
  away_team_id          UUID REFERENCES teams(id),
  home_team_placeholder TEXT,
  away_team_placeholder TEXT,
  kickoff_at            TIMESTAMPTZ NOT NULL,
  prediction_cutoff_at  TIMESTAMPTZ GENERATED ALWAYS AS (kickoff_at - INTERVAL '30 minutes') STORED,
  home_score_result     INT,
  away_score_result     INT,
  home_score_pen        INT,
  away_score_pen        INT,
  status                match_status NOT NULL DEFAULT 'scheduled',
  api_last_synced_at    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE predictions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  match_id   UUID NOT NULL REFERENCES matches(id),
  home_score INT NOT NULL CHECK (home_score >= 0 AND home_score <= 99),
  away_score INT NOT NULL CHECK (away_score >= 0 AND away_score <= 99),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

CREATE TABLE bonus_predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id),
  prediction_type bonus_type NOT NULL,
  team_id         UUID NOT NULL REFERENCES teams(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tournament_id, prediction_type)
);

CREATE TABLE match_scores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id),
  match_id       UUID NOT NULL REFERENCES matches(id),
  correct_winner BOOLEAN NOT NULL DEFAULT false,
  correct_draw   BOOLEAN NOT NULL DEFAULT false,
  correct_exact  BOOLEAN NOT NULL DEFAULT false,
  base_points    NUMERIC(4,1) NOT NULL DEFAULT 0,
  phase_factor   NUMERIC(4,1) NOT NULL DEFAULT 1,
  total_points   NUMERIC(6,1) NOT NULL DEFAULT 0,
  computed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

CREATE TABLE leaderboard (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id),
  tournament_id         UUID NOT NULL REFERENCES tournaments(id),
  match_points          NUMERIC(8,1) NOT NULL DEFAULT 0,
  bonus_points          NUMERIC(4,1) NOT NULL DEFAULT 0,
  grand_total           NUMERIC(8,1) NOT NULL DEFAULT 0,
  exact_result_count    INT NOT NULL DEFAULT 0,
  knockout_points       NUMERIC(8,1) NOT NULL DEFAULT 0,
  correct_outcome_count INT NOT NULL DEFAULT 0,
  registered_at         TIMESTAMPTZ NOT NULL,
  rank                  INT,
  previous_rank         INT,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tournament_id)
);

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  channel    TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload    JSONB,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  status     TEXT NOT NULL DEFAULT 'sent'
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_matches_kickoff        ON matches(kickoff_at);
CREATE INDEX idx_matches_status         ON matches(status);
CREATE INDEX idx_matches_phase          ON matches(phase_id);
CREATE INDEX idx_predictions_user       ON predictions(user_id);
CREATE INDEX idx_predictions_match      ON predictions(match_id);
CREATE INDEX idx_match_scores_user      ON match_scores(user_id);
CREATE INDEX idx_enrollments_user       ON enrollments(user_id);
CREATE INDEX idx_leaderboard_tournament ON leaderboard(tournament_id, grand_total DESC);
CREATE INDEX idx_notifications_user     ON notifications(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard       ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY users_read       ON users FOR SELECT USING (true);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY users_insert     ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- enrollments
CREATE POLICY enrollments_read_own   ON enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY enrollments_insert_own ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY enrollments_admin      ON enrollments FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- predictions
CREATE POLICY predictions_read_own   ON predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY predictions_insert_own ON predictions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
      AND now() < m.prediction_cutoff_at
      AND m.status = 'scheduled'
  )
);
CREATE POLICY predictions_update_own ON predictions FOR UPDATE USING (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
      AND now() < m.prediction_cutoff_at
      AND m.status = 'scheduled'
  )
);
CREATE POLICY predictions_admin ON predictions FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- bonus predictions
CREATE POLICY bonus_read_own   ON bonus_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bonus_insert_own ON bonus_predictions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = tournament_id AND now() < t.starts_at
  )
);
CREATE POLICY bonus_update_own ON bonus_predictions FOR UPDATE USING (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = tournament_id AND now() < t.starts_at
  )
);
CREATE POLICY bonus_admin ON bonus_predictions FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- match_scores
CREATE POLICY match_scores_read_own ON match_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY match_scores_admin    ON match_scores FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- leaderboard
CREATE POLICY leaderboard_read  ON leaderboard FOR SELECT USING (true);
CREATE POLICY leaderboard_admin ON leaderboard FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- teams, phases, matches: public read, admin write
CREATE POLICY teams_read    ON teams   FOR SELECT USING (true);
CREATE POLICY phases_read   ON phases  FOR SELECT USING (true);
CREATE POLICY matches_read  ON matches FOR SELECT USING (true);

CREATE POLICY teams_admin   ON teams   FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY phases_admin  ON phases  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY matches_admin ON matches FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- notifications
CREATE POLICY notifications_admin ON notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION compute_match_scores(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
  v_home_score   INT;
  v_away_score   INT;
  v_phase_factor NUMERIC;
  v_match_status match_status;
BEGIN
  SELECT m.home_score_result, m.away_score_result, m.status, p.fibonacci_factor
  INTO v_home_score, v_away_score, v_match_status, v_phase_factor
  FROM matches m
  JOIN phases p ON p.id = m.phase_id
  WHERE m.id = p_match_id;

  IF v_match_status != 'completed' THEN RETURN; END IF;
  IF v_home_score IS NULL OR v_away_score IS NULL THEN RETURN; END IF;

  INSERT INTO match_scores (
    user_id, match_id,
    correct_winner, correct_draw, correct_exact,
    base_points, phase_factor, total_points
  )
  SELECT
    pred.user_id,
    pred.match_id,
    CASE
      WHEN v_home_score > v_away_score AND pred.home_score > pred.away_score THEN true
      WHEN v_away_score > v_home_score AND pred.away_score > pred.home_score THEN true
      ELSE false
    END,
    CASE
      WHEN v_home_score = v_away_score AND pred.home_score = pred.away_score THEN true
      ELSE false
    END,
    CASE
      WHEN v_home_score = pred.home_score AND v_away_score = pred.away_score THEN true
      ELSE false
    END,
    (
      CASE
        WHEN v_home_score > v_away_score AND pred.home_score > pred.away_score THEN 2
        WHEN v_away_score > v_home_score AND pred.away_score > pred.home_score THEN 2
        WHEN v_home_score = v_away_score AND pred.home_score = pred.away_score THEN 2
        ELSE 0
      END
      +
      CASE
        WHEN v_home_score = pred.home_score AND v_away_score = pred.away_score THEN 5
        ELSE 0
      END
    )::NUMERIC,
    v_phase_factor,
    (
      CASE
        WHEN v_home_score > v_away_score AND pred.home_score > pred.away_score THEN 2
        WHEN v_away_score > v_home_score AND pred.away_score > pred.home_score THEN 2
        WHEN v_home_score = v_away_score AND pred.home_score = pred.away_score THEN 2
        ELSE 0
      END
      +
      CASE
        WHEN v_home_score = pred.home_score AND v_away_score = pred.away_score THEN 5
        ELSE 0
      END
    ) * v_phase_factor
  FROM predictions pred
  WHERE pred.match_id = p_match_id
  ON CONFLICT (user_id, match_id)
  DO UPDATE SET
    correct_winner = EXCLUDED.correct_winner,
    correct_draw   = EXCLUDED.correct_draw,
    correct_exact  = EXCLUDED.correct_exact,
    base_points    = EXCLUDED.base_points,
    phase_factor   = EXCLUDED.phase_factor,
    total_points   = EXCLUDED.total_points,
    computed_at    = now();

  PERFORM recompute_leaderboard();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION compute_bonus_points(p_user_id UUID, p_tournament_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_champion_team_id UUID;
  v_finalist1_id     UUID;
  v_finalist2_id     UUID;
  v_total            NUMERIC := 0;
BEGIN
  SELECT
    CASE
      WHEN m.home_score_result > m.away_score_result THEN m.home_team_id
      WHEN m.away_score_result > m.home_score_result THEN m.away_team_id
      ELSE NULL
    END
  INTO v_champion_team_id
  FROM matches m
  JOIN phases p ON p.id = m.phase_id
  WHERE p.slug = 'final' AND m.status = 'completed'
  LIMIT 1;

  SELECT home_team_id, away_team_id
  INTO v_finalist1_id, v_finalist2_id
  FROM matches m
  JOIN phases p ON p.id = m.phase_id
  WHERE p.slug = 'final'
  LIMIT 1;

  IF v_champion_team_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM bonus_predictions
      WHERE user_id = p_user_id
        AND tournament_id = p_tournament_id
        AND prediction_type = 'champion'
        AND team_id = v_champion_team_id
    ) THEN
      v_total := v_total + 10;
    END IF;
  END IF;

  IF v_finalist1_id IS NOT NULL AND v_finalist2_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM bonus_predictions
      WHERE user_id = p_user_id
        AND tournament_id = p_tournament_id
        AND prediction_type IN ('finalist_1', 'finalist_2')
        AND team_id = v_finalist1_id
    ) AND EXISTS (
      SELECT 1 FROM bonus_predictions
      WHERE user_id = p_user_id
        AND tournament_id = p_tournament_id
        AND prediction_type IN ('finalist_1', 'finalist_2')
        AND team_id = v_finalist2_id
    ) THEN
      v_total := v_total + 10;
    END IF;
  END IF;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION recompute_leaderboard()
RETURNS VOID AS $$
BEGIN
  INSERT INTO leaderboard (
    user_id, tournament_id, match_points, bonus_points, grand_total,
    exact_result_count, knockout_points, correct_outcome_count,
    registered_at, rank, previous_rank, updated_at
  )
  SELECT
    e.user_id,
    e.tournament_id,
    COALESCE(mp.match_points, 0),
    compute_bonus_points(e.user_id, e.tournament_id),
    COALESCE(mp.match_points, 0) + compute_bonus_points(e.user_id, e.tournament_id),
    COALESCE(mp.exact_count, 0),
    COALESCE(mp.ko_points, 0),
    COALESCE(mp.outcome_count, 0),
    e.registered_at,
    NULL,
    lb_prev.rank,
    now()
  FROM enrollments e
  LEFT JOIN (
    SELECT
      ms.user_id,
      SUM(ms.total_points) AS match_points,
      COUNT(*) FILTER (WHERE ms.correct_exact) AS exact_count,
      SUM(ms.total_points) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM matches m JOIN phases p ON p.id = m.phase_id
          WHERE m.id = ms.match_id AND p.epoch = 'knockout'
        )
      ) AS ko_points,
      COUNT(*) FILTER (WHERE ms.correct_winner OR ms.correct_draw) AS outcome_count
    FROM match_scores ms
    GROUP BY ms.user_id
  ) mp ON mp.user_id = e.user_id
  LEFT JOIN leaderboard lb_prev ON lb_prev.user_id = e.user_id AND lb_prev.tournament_id = e.tournament_id
  WHERE e.payment_status = 'confirmed'
  ON CONFLICT (user_id, tournament_id)
  DO UPDATE SET
    match_points          = EXCLUDED.match_points,
    bonus_points          = EXCLUDED.bonus_points,
    grand_total           = EXCLUDED.grand_total,
    exact_result_count    = EXCLUDED.exact_result_count,
    knockout_points       = EXCLUDED.knockout_points,
    correct_outcome_count = EXCLUDED.correct_outcome_count,
    previous_rank         = leaderboard.rank,
    updated_at            = now();

  WITH ranked AS (
    SELECT id,
      ROW_NUMBER() OVER (
        ORDER BY
          grand_total DESC,
          exact_result_count DESC,
          knockout_points DESC,
          correct_outcome_count DESC,
          registered_at ASC
      ) AS new_rank
    FROM leaderboard
    WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'quiniela')
  )
  UPDATE leaderboard lb
  SET rank = r.new_rank
  FROM ranked r
  WHERE lb.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- AUTH TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO phases (name_en, name_es, slug, sort_order, match_count, fibonacci_factor, epoch)
VALUES
  ('Group Stage',       'Fase de Grupos',         'group-stage',    1, 72, 1.0,  'group'),
  ('Round of 32',       'Dieciseisavos de Final', 'round-of-32',    2, 16, 2.0,  'knockout'),
  ('Round of 16',       'Octavos de Final',       'round-of-16',    3,  8, 3.0,  'knockout'),
  ('Quarter-finals',    'Cuartos de Final',       'quarter-finals', 4,  4, 5.0,  'knockout'),
  ('Semi-finals',       'Semifinales',            'semi-finals',    5,  2, 8.0,  'knockout'),
  ('Third-place match', 'Final de Bronce',        'third-place',    6,  1, 8.0,  'knockout'),
  ('Final',             'Final',                  'final',          7,  1, 13.0, 'knockout')
ON CONFLICT (slug) DO NOTHING;
