/** Labels alignés sur PolicyContract.CareType */
export const CARE_TYPE_OPTIONS = [
  { value: 0, label: "Général" },
  { value: 1, label: "Dentaire" },
  { value: 2, label: "Vision" },
  { value: 3, label: "Chirurgie" },
  { value: 4, label: "Pharmacie" },
];

/** PolicyContract.PolicyStatus */
export const POLICY_STATUS_LABELS = ["Active", "Expirée", "Annulée"];

/** ClaimContract.Status */
export const CLAIM_STATUS_LABELS = ["En attente", "Approuvé", "Rejeté"];

/** MedicalRecord.RecordType */
export const RECORD_TYPE_LABELS = [
  "Consultation",
  "Ordonnance",
  "Analyse labo",
  "Imagerie",
  "Chirurgie",
  "Autre",
];
export const RECORD_TYPE_MAP = {
  Consultation: 0,
  Prescription: 1,
  LabResult:    2,
  Imaging:      3,
  Surgery:      4,
  Other:        5,
};

export function formatAddr(a, n = 6) {
  if (!a) return "—";
  const s = String(a);
  if (s.length <= 2 * n + 3) return s;
  return `${s.slice(0, n)}…${s.slice(-n)}`;
}

export function ts(sec) {
  if (sec == null || sec === 0n) return "—";
  const n = typeof sec === "bigint" ? Number(sec) : Number(sec);
  if (!n) return "—";
  return new Date(n * 1000).toLocaleString();
}
