const GRACE_PERIOD_HOURS = 72;
const GRACE_PERIOD_MS = GRACE_PERIOD_HOURS * 60 * 60 * 1000;

const parseTimestamp = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return timestamp;
};

export const isWithinGracePeriod = (
  createdAt: string | null | undefined,
  graceExpiresAt?: string | null,
) => {
  const now = Date.now();

  const graceExpirationTimestamp = parseTimestamp(graceExpiresAt);

  if (graceExpirationTimestamp !== null) {
    return now <= graceExpirationTimestamp;
  }

  const createdTimestamp = parseTimestamp(createdAt);

  if (createdTimestamp === null) {
    return false;
  }

  return now - createdTimestamp <= GRACE_PERIOD_MS;
};

export const getGracePeriodExpiry = (
  createdAt: string | null | undefined,
  graceExpiresAt?: string | null,
) => {
  const graceExpirationTimestamp = parseTimestamp(graceExpiresAt);

  if (graceExpirationTimestamp !== null) {
    return graceExpirationTimestamp;
  }

  const createdTimestamp = parseTimestamp(createdAt);

  if (createdTimestamp === null) {
    return null;
  }

  return createdTimestamp + GRACE_PERIOD_MS;
};

export { GRACE_PERIOD_HOURS };
