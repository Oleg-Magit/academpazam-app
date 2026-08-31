export const ACADEMPAZAM_DATA_CHANGED_EVENT = 'academpazam:data-changed';

export const notifyAcademPazamDataChanged = () => {
    window.dispatchEvent(new Event(ACADEMPAZAM_DATA_CHANGED_EVENT));
};
