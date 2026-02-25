export const APP_VERSION = '1.2.0';
export const BREAKING_DATA_VERSION = 1;

/**
 * Manually increment BREAKING_DATA_VERSION only when a destructive DB reset is required.
 * This will trigger the UpgradeGuard modal for all users upon their next visit.
 */
