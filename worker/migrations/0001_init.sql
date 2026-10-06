-- Meilleur score par averse et par appareil (GAME_SPEC §23). Le journal est gardé pour pouvoir
-- rejouer et revérifier un score plus tard (changement de physique, contestation).
CREATE TABLE scores (
  averse_id   TEXT    NOT NULL,
  device_id   TEXT    NOT NULL,
  pseudo      TEXT    NOT NULL,
  score       INTEGER NOT NULL,
  stars       INTEGER NOT NULL,
  best_chain  INTEGER NOT NULL,
  log         TEXT    NOT NULL,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (averse_id, device_id)
);
CREATE INDEX scores_rank ON scores (averse_id, score DESC, created_at ASC);
