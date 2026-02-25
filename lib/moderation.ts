const FLAGGED_WORDS = [
  "fuck", "shit", "ass", "bitch", "damn", "crap", "dick", "cock", "pussy",
  "bastard", "slut", "whore", "nigger", "nigga", "faggot", "retard",
  "cunt", "motherfucker", "asshole", "bullshit", "piss",
];

export function moderateContent(text: string): { isClean: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const word of FLAGGED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(lower)) {
      return { isClean: false, reason: `Content contains inappropriate language.` };
    }
  }
  return { isClean: true };
}
