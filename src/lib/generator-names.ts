/**
 * Dictionary of Indonesian names used by the Setor Gmail generator.
 * Shared between the Generator on /setor and the Validator on /checker.
 */

export const FIRST_NAMES = [
  "tatang", "bakri", "brian", "rohani", "wahyu", "lastri", "andi", "budi", "citra", "dewi",
  "eka", "fajar", "gita", "hendra", "indah", "joko", "kadek", "lina", "made", "nina",
  "omar", "putri", "ratna", "sari", "tomi", "umi", "agus", "bagus", "cahya", "dian",
  "erik", "fitri", "galih", "heru", "ilham", "kartika", "rizki", "bayu", "yoga", "aditya",
  "dimas", "nurul", "ayu", "maya", "anisa", "tri", "kurnia", "lestari", "maulana", "pratama",
  "saputra", "taufik", "utami", "wibowo", "yudha", "zainal", "bagas", "cahyono", "danang",
  "eko", "firman", "gunawan", "hadi", "irawan", "jefri", "kusuma", "lukman", "mulyadi",
  "nugroho", "oktavian", "panji", "rahmat", "santoso", "untung", "widodo", "yanuar", "zulham"
];

export const SECOND_NAMES = [
  "hill", "setiawan", "purnama", "young", "hashim", "clark", "wijaya", "kusuma", "putra",
  "putri", "hartono", "hidayat", "saputra", "wibowo", "santoso", "pratama", "nugroho",
  "firmansyah", "ramadhan", "anwar", "kurniawan", "susanto", "gunawan", "lesmana",
  "mahendra", "wardhana", "syahputra", "sulaiman", "iskandar", "hamid", "hasan", "saleh",
  "yusuf", "ibrahim", "mansur", "zulkarnain", "alamsyah", "suherman", "subagyo", "widodo",
  "darmawan", "surya", "utama", "baskoro", "nugraha", "permana", "wibisono", "syarif",
  "mustofa", "fauzi", "alamsyah", "halim", "nasution", "lubis", "siregar", "harahap"
];

/**
 * Checks whether an email matches the exact algorithmic generation pattern of Setor:
 * Format: [4 lowercase letters][FIRST_NAME][SECOND_NAME][2 digits]@gmail.com
 * Example: mlewuntungnugraha80@gmail.com, wwfiuntunghill40@gmail.com
 */
export function isSetorGeneratedPattern(email: string): boolean {
  const clean = email.toLowerCase().trim();
  const parts = clean.split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (domain !== "gmail.com" && domain !== "googlemail.com") return false;

  const local = parts[0].replace(/\./g, "");
  // Pattern: exactly 4 letters prefix + name1 + name2 + 2 digits suffix
  const match = local.match(/^([a-z]{4})([a-z]{6,25})(\d{2})$/);
  if (!match) return false;

  const middle = match[2];
  for (const fn of FIRST_NAMES) {
    if (middle.startsWith(fn)) {
      const rest = middle.slice(fn.length);
      if (SECOND_NAMES.includes(rest)) {
        return true;
      }
    }
  }
  return false;
}
