/** Fixed choices the editors offer, matching the API's enums. */

/** The 14 offices in constitutional order (Art. 6); the API sets the display order from this. */
export const EXECUTIVE_OFFICES = [
  'President',
  'Vice President',
  'Secretary General',
  'Assistant Secretary General',
  'Treasurer',
  'Financial Secretary',
  'Public Relations Officer',
  'Assistant Public Relations Officer',
  'Editor-in-Chief',
  'Social Secretary',
  'Assistant Social Secretary',
  'Sports Secretary',
  'Assistant Sports Secretary',
  'Welfare Secretary',
] as const

/** Principal officers of the Senate (Art. 18). */
export const SENATE_POSITIONS = [
  'Senate President',
  'Deputy Senate President',
  'Senate Leader',
  'Chief Whip',
] as const

export const BIO_WORDS = 60

export const PUBLICATION_SERIES = [
  { value: 'recipharm', label: 'Recipharm (annual magazine)' },
  { value: 'newspaper', label: 'Newspaper' },
  { value: 'substack', label: 'Substack' },
] as const

export const SOCIAL_PLATFORMS = [
  'Instagram',
  'X',
  'YouTube',
  'LinkedIn',
  'Facebook',
  'TikTok',
  'WhatsApp',
] as const
