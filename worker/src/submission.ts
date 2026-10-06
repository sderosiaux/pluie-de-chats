// Vérification d'une partie soumise (GAME_SPEC §23–§24) : on ne croit pas le client, on rejoue.
// Module pur : aucune API Workers, testable partout.

import { campaignAverse, finalScore, runReplay, stars } from '../../src/sim';
import type { InputLog } from '../../src/sim';

export interface Submission {
  averseId: string;
  pseudo: string;
  deviceId: string;
  log: InputLog;
  score: number;
}

export interface Verified {
  averseId: string;
  pseudo: string;
  deviceId: string;
  log: InputLog;
  score: number;
  stars: number;
  bestChain: number;
}

export type Rejection = 'bad_request' | 'unknown_averse' | 'invalid_log' | 'score_mismatch';

const MAX_LOG = 200; // bien au-delà du nombre de pelotes possible dans une averse
const AVERSE_ID = /^(\d{1,2})-([1-5])$/;
const DEVICE_ID = /^[A-Za-z0-9-]{8,64}$/;

/** Pseudo affichable : lettres, chiffres, espace, _ et -, 1 à 16 caractères. */
export function cleanPseudo(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const p = raw.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (p.length < 1 || p.length > 16 || !/^[\p{L}\p{N} _-]+$/u.test(p)) return null;
  return p;
}

export function parseSubmission(body: unknown): Submission | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  const pseudo = cleanPseudo(b.pseudo);
  if (typeof b.averseId !== 'string' || !AVERSE_ID.test(b.averseId)) return null;
  if (typeof b.deviceId !== 'string' || !DEVICE_ID.test(b.deviceId)) return null;
  if (!pseudo || !Number.isInteger(b.score) || !Array.isArray(b.log) || b.log.length > MAX_LOG) return null;
  const log: InputLog = [];
  for (const e of b.log) {
    if (typeof e !== 'object' || e === null) return null;
    const { tick, angleDeci } = e as Record<string, unknown>;
    if (!Number.isInteger(tick) || (tick as number) < 0 || !Number.isInteger(angleDeci)) return null;
    log.push({ tick: tick as number, angleDeci: angleDeci as number });
  }
  return { averseId: b.averseId, pseudo, deviceId: b.deviceId, log, score: b.score as number };
}

export function verify(sub: Submission): Verified | Rejection {
  const m = AVERSE_ID.exec(sub.averseId);
  const averse = m ? campaignAverse(Number(m[1]), Number(m[2])) : undefined;
  if (!averse) return 'unknown_averse';
  const r = runReplay(averse, sub.log);
  if (!r.valid) return 'invalid_log';
  const score = finalScore(r.state);
  if (score !== sub.score) return 'score_mismatch';
  return { ...sub, score, stars: stars(r.state), bestChain: r.state.bestChain };
}
