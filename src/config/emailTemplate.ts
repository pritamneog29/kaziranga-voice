// The director email address and default message body.

export const DIRECTOR_EMAIL = 'dir.kaziranganp@gmail.com';

export const DEFAULT_SUBJECT =
  'Concern regarding Kaziranga ESZ and nearby development';

const SUBJECT_VARIANTS = [
  'Concern regarding Kaziranga ESZ and nearby development',
  'Request for careful review of Kaziranga development plans',
  'Kaziranga National Park: conservation and community concerns',
];

const INTRO_VARIANTS = [
  'I am writing to share a concern about the proposed reduction of the Eco-Sensitive Zone around Kaziranga National Park and the possibility of new construction near the park boundary.',
  'I am reaching out to ask for your attention to proposals that may reduce the Eco-Sensitive Zone around Kaziranga National Park and increase construction pressure near the park.',
  'I am writing as a concerned citizen about the proposed changes around Kaziranga National Park, especially anything that could weaken the Eco-Sensitive Zone or encourage more construction near the park.',
];

const REQUEST_LEAD_VARIANTS = [
  'I respectfully request that your office:',
  'I would be grateful if your office could:',
  'I respectfully urge your office to:',
];

function pickVariant(variants: string[], seed: string): string {
  if (!variants.length) {
    return '';
  }

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return variants[hash % variants.length];
}

export const buildDefaultSubject = (seed = 'kaziranga-default'): string =>
  pickVariant(SUBJECT_VARIANTS, seed);

export const buildDefaultBody = (
  personalExperience: string,
  senderName: string,
  seed = 'kaziranga-default',
): string => {
  const subjectLine = buildDefaultSubject(seed);
  const intro = pickVariant(INTRO_VARIANTS, seed);
  const requestLead = pickVariant(REQUEST_LEAD_VARIANTS, seed);
  const personalSection = personalExperience.trim()
   ? `My personal connection to Kaziranga:

${personalExperience.trim()}

`
    : '';

  return `
To,
The Director,
Kaziranga National Park & Tiger Reserve,
Bokakhat, Golaghat, Assam – 785612

Subject: ${subjectLine}

Respected Sir/Madam,

${intro}

Kaziranga is a UNESCO World Heritage Site and an important habitat for rhinos, elephants, tigers, and many bird species. The Eco-Sensitive Zone helps keep this landscape connected and resilient, especially during flood season when wildlife movement becomes critical.

I am also concerned that construction pressure near the park could affect indigenous communities who have long lived with and cared for these lands.

${personalSection}**My Requests**

${requestLead}
  1. Keep the ESZ protections around Kaziranga intact.
  2. Ensure any proposed project near the park is reviewed carefully and transparently.
  3. Protect the land, livelihood, and participation rights of indigenous communities.
  4. Preserve wildlife corridors toward the Karbi Anglong hills.

Kaziranga is deeply important to many people, and I hope it is protected with care.

Thanking you,

${senderName || '[Your Name]'}
`.trimStart();
};
