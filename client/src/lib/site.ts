/**
 * Site-wide facts from the constitution and the PANS leadership (see README → Identity and naming).
 * From issue #19 these come from GET /api/settings so admins can change them; until then they live here.
 */
export const SITE = {
  name: 'Pharmaceutical Association of Nigeria Students, University of Lagos',
  shortName: 'PANS UNILAG',
  motto: 'Service to Humanity',
  postalAddress: [
    'c/o The Dean’s Office, Faculty of Pharmacy',
    'College of Medicine Campus, University of Lagos',
    'P.M.B. 12003, Lagos',
  ],
  socialLinks: [
    { platform: 'Instagram', url: 'https://www.instagram.com/pans_unilag/' },
    { platform: 'X', url: 'https://x.com/PANS_Unilag' },
    { platform: 'YouTube', url: 'https://www.youtube.com/@pansunilag3998' },
    {
      platform: 'LinkedIn',
      url: 'https://www.linkedin.com/company/pharmaceutical-association-of-nigerian-students-pans-unilag/',
    },
  ],
} as const
