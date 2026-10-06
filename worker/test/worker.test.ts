// Porte P3 : un vrai Worker (workerd via Wrangler) avec une base D1 locale migrée.
// Une partie valide est acceptée ; score modifié, journal modifié ou averse inconnue sont refusés.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { unstable_startWorker } from 'wrangler';
import { campaignAverse, finalScore } from '../../src/sim';
import { expertBot, playAverse } from '../../src/bots/bots';

const CONFIG = join(__dirname, '..', 'wrangler.jsonc');
let worker: Awaited<ReturnType<typeof unstable_startWorker>>;
let persist: string;

const averse = campaignAverse(1, 2)!;
const played = playAverse(averse, expertBot(averse));
const valid = { averseId: '1-2', pseudo: 'Minou', deviceId: 'device-aaaa-0001', log: played.log, score: finalScore(played.state) };

async function post(body: unknown, origin = 'https://sderosiaux.github.io') {
  const res = await worker.fetch('http://local/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
  });
  return { status: res.status, headers: res.headers, body: (await res.json()) as Record<string, unknown> };
}

beforeAll(async () => {
  persist = mkdtempSync(join(tmpdir(), 'pdc-d1-'));
  execFileSync('npx', ['wrangler', 'd1', 'migrations', 'apply', 'DB', '--local', '--config', CONFIG, '--persist-to', persist], { stdio: 'pipe' });
  worker = await unstable_startWorker({ config: CONFIG, dev: { persist } });
}, 120_000);

afterAll(async () => {
  await worker?.dispose();
  rmSync(persist, { recursive: true, force: true });
});

describe('classement : rejeu serveur', () => {
  it('une partie valide est acceptée et classée', async () => {
    const r = await post(valid);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ accepted: true, score: valid.score, best: valid.score, rank: 1, total: 1 });
  });

  it('score modifié : refusé', async () => {
    const r = await post({ ...valid, deviceId: 'device-bbbb-0002', score: valid.score + 1 });
    expect(r.status).toBe(422);
    expect(r.body.error).toBe('score_mismatch');
  });

  it('journal modifié : refusé', async () => {
    const log = valid.log.map((e, i) => (i === 0 ? { ...e, angleDeci: e.angleDeci === 900 ? 901 : 900 } : e));
    const r = await post({ ...valid, deviceId: 'device-cccc-0003', log });
    expect(r.status).toBe(422);
    expect(['score_mismatch', 'invalid_log']).toContain(r.body.error);
    const reordered = await post({ ...valid, deviceId: 'device-cccc-0004', log: [...valid.log].reverse() });
    expect(reordered.status).toBe(422);
    expect(reordered.body.error).toBe('invalid_log');
  });

  it('averse inconnue (ou averse de test h1) : refusée', async () => {
    expect((await post({ ...valid, averseId: '9-5' })).body.error).toBe('unknown_averse'); // chapitre non figé
    expect((await post({ ...valid, averseId: 'h1' })).status).toBe(400);
  });

  it('un score inférieur du même appareil ne remplace pas le meilleur', async () => {
    const short = playAverse(averse, () => null); // aucun tir
    const r = await post({ ...valid, log: short.log, score: finalScore(short.state) });
    expect(r.status).toBe(200);
    expect(r.body.best).toBe(valid.score);
  });

  it('top 50 et rang de l’appareil', async () => {
    const res = await worker.fetch(`http://local/top?averse=1-2&deviceId=${valid.deviceId}`);
    const body = (await res.json()) as { top: Array<{ pseudo: string; score: number }>; me: { rank: number } };
    expect(body.top[0]).toMatchObject({ pseudo: 'Minou', score: valid.score });
    expect(body.me.rank).toBe(1);
  });

  it('CORS : seulement les origines autorisées', async () => {
    expect((await post(valid)).headers.get('Access-Control-Allow-Origin')).toBe('https://sderosiaux.github.io');
    expect((await post(valid, 'https://evil.example')).headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('pseudo ou corps invalides : refusés', async () => {
    expect((await post({ ...valid, pseudo: '<script>' })).status).toBe(400);
    expect((await post({ ...valid, pseudo: '' })).status).toBe(400);
    expect((await post('pas un objet')).status).toBe(400);
  });
});
