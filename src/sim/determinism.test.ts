// Porte P1 « déterminisme » (GAME_SPEC §24) : un journal rejoué donne toujours le même état, au bit près.
import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/replays.json';
import { handmadeById } from './averses/handmade';
import { finalScore, hashState, runReplay } from './index';
import type { InputLog } from './types';

describe('déterminisme', () => {
  for (const f of fixtures as Array<{ averseId: string; log: InputLog; hash: string; score: number }>) {
    it(`${f.averseId} : 100 rejeux → hash ${f.hash} et score ${f.score} identiques`, () => {
      const averse = handmadeById(f.averseId)!;
      for (let i = 0; i < 100; i++) {
        const r = runReplay(averse, f.log);
        expect(r.valid).toBe(true);
        expect(hashState(r.state)).toBe(f.hash);
        expect(finalScore(r.state)).toBe(f.score);
      }
    });
  }
});
