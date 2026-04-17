import crypto from "crypto";

export const BOOKING_PROOF_OF_WORK_DIFFICULTY = 3;

export function verifyBookingProofOfWork({ challenge, nonce }) {
  if (!challenge || typeof challenge !== "string") {
    return false;
  }

  if (!nonce || typeof nonce !== "string" || !/^\d+$/.test(nonce)) {
    return false;
  }

  const hash = crypto.createHash("sha256").update(`${challenge}:${nonce}`).digest("hex");
  return hash.startsWith("0".repeat(BOOKING_PROOF_OF_WORK_DIFFICULTY));
}
