const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5002";
export function apiUrl(path) {
    const cleanBase = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
}
