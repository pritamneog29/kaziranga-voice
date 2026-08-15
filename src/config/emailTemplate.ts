// The director email address and default message body.

export const DIRECTOR_EMAIL = 'dir.kaziranganp@gmail.com';

export const DEFAULT_SUBJECT =
  'Urgent Concern: Reduction of Eco-Sensitive Zone & Hotel Construction at Kaziranga National Park';

export const buildDefaultBody = (
  personalExperience: string,
  senderName: string,
  senderEmail: string,
): string => `
To,
The Director,
Kaziranga National Park & Tiger Reserve,
Bokakhat, Golaghat, Assam – 785 612

Subject: ${DEFAULT_SUBJECT}

Respected Sir/Madam,

I write to you as a deeply concerned citizen regarding two interrelated and urgent threats to Kaziranga National Park — a UNESCO World Heritage Site and one of the last refuges of the Indian one-horned rhinoceros (Rhinoceros unicornis).

**1. Reduction of the Eco-Sensitive Zone (ESZ)**

Kaziranga National Park is home to the world's largest population of the Indian one-horned rhinoceros, two-thirds of the global total, along with significant populations of Asian elephants, wild water buffalo, swamp deer (barasingha), Royal Bengal tigers, and over 480 species of birds — making it one of the most biologically rich landscapes on Earth.

The Eco-Sensitive Zone (ESZ) surrounding the park acts as a critical buffer between the protected core area and human development. It prevents habitat fragmentation, provides migration corridors for wildlife (especially during annual Brahmaputra floods when animals move to the Karbi Anglong hills), and acts as a shock-absorber against encroachment and pollution.

Reports of proposals to reduce or dilute the ESZ notification area are deeply alarming. Any reduction in the ESZ directly:
  - Shrinks the migration corridor that animals depend on for survival during monsoon floods.
  - Enables commercial and industrial construction closer to the park boundary.
  - Violates the spirit and intent of the National Green Tribunal (NGT) and Supreme Court orders protecting biodiversity-sensitive areas.
  - Sets a dangerous precedent for other protected areas across India.

**2. Protection of Indigenous Lands and Communities**

Reports further indicate that a luxury hotel — reportedly a Hyatt property — is being proposed for construction in the vicinity of the national park on land traditionally inhabited, used, and cared for by indigenous communities. This raises grave concerns that go beyond ecology alone:

  - Indigenous communities — including the Mising, Karbi, and other forest-dwelling peoples — have custodial relationships with these lands going back generations. Their land, livelihood, cultural, and customary rights under the Scheduled Tribes and Other Traditional Forest Dwellers (Recognition of Forest Rights) Act, 2006, must be upheld.
  - No development should proceed without full, prior, and meaningful consultation with the affected indigenous communities, and without their informed consent where applicable.
  - Construction of large hospitality infrastructure on or near such ecologically sensitive and socially significant land will increase traffic, noise, light pollution, waste generation, and human–wildlife conflict, while also risking displacement and cultural erosion.
  - Indigenous land-rights advocates such as Pranab Doley, from the Mising community, have been crucial in drawing attention to these threats.
  - This undermines India's international commitments under the Convention on Biological Diversity (CBD) and UNESCO's obligations for World Heritage Sites.

**My Personal Connection to Kaziranga**

${personalExperience.trim() || '[No personal experience shared.]'}

**My Requests**

I respectfully urge you to:
  1. Actively oppose and formally object to any reduction of the ESZ boundaries surrounding Kaziranga National Park.
  2. Ensure that all ongoing and proposed hotel or commercial construction projects within or adjacent to the ESZ undergo rigorous, transparent Environmental Impact Assessments with full community consultation.
  3. Safeguard the land, livelihood, cultural, and customary rights of indigenous communities in the region, and ensure no project proceeds without their meaningful participation.
  4. Strengthen wildlife corridors connecting Kaziranga to the Karbi Anglong hills to ensure safe annual migration of the park's wildlife.
  5. Keep the public and civil society informed of all decisions regarding the ESZ.

Kaziranga is not just a national treasure — it is humanity's heritage. I implore you to protect it for future generations.

Thanking you,

${senderName || '[Your Name]'}
${senderEmail || '[Your Contact Information]'}

---
Sent via Kaziranga Voice — A citizen-action app for wildlife conservation.
`.trimStart();
