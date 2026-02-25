export const APP_VERSION = '1.3.2';
export const BREAKING_DATA_VERSION = 2;

/**
 * Manually increment BREAKING_DATA_VERSION only when a destructive DB reset is required.
 * This will trigger the UpgradeGuard modal for all users upon their next visit.
 */
