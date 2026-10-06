// Écrit l'empreinte de chaque averse figée (src/sim/averses/fingerprints.ts). Utilisé par freeze-chapters et
// par `npm run fingerprints`.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateAverse } from '../../src/sim/averses/generator';
import { averseFingerprint } from '../../src/sim/averses/structure';

export function writeFingerprints(seeds: Record<string, number>): void {
  const lines = Object.entries(seeds).map(([id, seed]) => {
    const [c, i] = id.split('-').map(Number);
    return `  '${id}': '${averseFingerprint(generateAverse(c, i, seed))}',`;
  });
  writeFileSync(fileURLToPath(new URL('../../src/sim/averses/fingerprints.ts', import.meta.url)), `// GÉNÉRÉ par scripts/fingerprint-chapters.ts — ne pas éditer à la main.
// Empreinte de chaque averse figée : le test de structure échoue si le générateur la fait dériver.
export const CAMPAIGN_FINGERPRINTS: Readonly<Record<string, string>> = {
${lines.join('\n')}
};
`);
}
