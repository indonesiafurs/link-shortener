export const API_URL = import.meta.env.PROD === true ? '' : import.meta.env.VITE_BASE_API_URL
export const DISPLAY_BASE_URL = import.meta.env.VITE_DISPLAY_BASE_URL ?? 'furs.id'
