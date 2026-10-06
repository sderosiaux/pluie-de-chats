// Réécrit les empreintes des averses figées à partir des graines actuelles. À lancer seul (`npm run fingerprints`)
// uniquement si une dérive est VOULUE (physique ou générateur modifiés, graines revalidées).
import { CAMPAIGN_SEEDS } from '../src/sim/averses/chapters';
import { writeFingerprints } from './lib/fingerprints';

writeFingerprints({ ...CAMPAIGN_SEEDS });
