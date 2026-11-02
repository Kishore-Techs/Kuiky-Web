import { useState, useEffect } from "react";
import { getImageUrl, MEDIA_BASE_URL, FALLBACK_MEDIA_BASE_URL } from "./config";

/**
 * 🔗 Global Singleton Cache for Blobs
 * Prevents redundant network requests and ensures smooth UI performance.
 */
const imageCache = new Map();
const pendingRequests = new Map();

/**
 * 🛡️ Smart Contextual Fallback for Missing Media Assets
 */
export const getFallbackImage = (url) => {
    const u = String(url || '').toLowerCase();
    if (u.includes('auto') || u.includes('vehicle')) return '/vehicle_auto.png';
    if (u.includes('ambulance')) return '/vehicle_ambulance.png';
    if (u.includes('puncture')) return '/vehicle_puncture.png';
    if (u.includes('grocery') || u.includes('supermarket')) return '/images/categories/grocery.png';
    if (u.includes('fashion') || u.includes('cloth')) return '/images/categories/fashion.png';
    if (u.includes('electronic') || u.includes('mobile')) return '/images/categories/electronics.png';
    if (u.includes('beauty')) return '/images/categories/beauty.png';
    if (u.includes('home') || u.includes('hostel') || u.includes('rental')) return '/images/categories/home.png';
    if (u.includes('electrical') || u.includes('paint')) return '/images/categories/electrical.png';
    if (u.includes('food') || u.includes('restaurent') || u.includes('restaurant')) return '/images/categories/grocery.png';
    return '/images/no-image.png';
};

export const useSmartImage = (rawPath) => {
    const [src, setSrc] = useState(getImageUrl(null));
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!rawPath) {
            setSrc(getImageUrl(null));
            setLoaded(true);
            return;
        }

        const fullUrl = getImageUrl(rawPath);

        // ⚡ Direct Fast-Path: Local static assets & data URIs do not need blob fetches
        if (fullUrl.startsWith('/') || fullUrl.startsWith('./') || fullUrl.startsWith('data:')) {
            setSrc(fullUrl);
            setLoaded(true);
            return;
        }

        // 🚀 Hit cache first
        if (imageCache.has(fullUrl)) {
            setSrc(imageCache.get(fullUrl));
            setLoaded(true);
            return;
        }

        const loadImage = async () => {
            // 🛑 Request Collapsing: Join existing request if pending
            if (pendingRequests.has(fullUrl)) {
                try {
                    const sharedBlobUrl = await pendingRequests.get(fullUrl);
                    setSrc(sharedBlobUrl);
                    setLoaded(true);
                } catch (err) {
                    setSrc(fullUrl);
                } finally {
                    setLoaded(true);
                }
                return;
            }

            const fetchPromise = (async () => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);

                try {
                    const response = await fetch(fullUrl, {
                        signal: controller.signal,
                        headers: { 'ngrok-skip-browser-warning': 'true' }
                    });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const contentType = response.headers.get('content-type') || '';
                        if (contentType.startsWith('image/')) {
                            const blob = await response.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            imageCache.set(fullUrl, blobUrl);
                            return blobUrl;
                        }
                    }
                    throw new Error('Not an image or status: ' + response.status);
                } catch (err) {
                    clearTimeout(timeoutId);
                    // Fallback to production media CDN if primary URL was not already codingboss
                    const fallbackBase = (FALLBACK_MEDIA_BASE_URL || "https://api.codingboss.in").replace(/\/$/, '');
                    if (!fullUrl.includes("api.codingboss.in")) {
                        try {
                            const pathParts = fullUrl.split("/");
                            const mediaIdx = pathParts.findIndex(p => p === "media" || p === "static");
                            if (mediaIdx !== -1) {
                                const rel = pathParts.slice(mediaIdx).join("/");
                                const fallbackUrl = `${fallbackBase}/${rel}`;
                                const fbRes = await fetch(fallbackUrl);
                                if (fbRes.ok) {
                                    const blob = await fbRes.blob();
                                    const blobUrl = URL.createObjectURL(blob);
                                    imageCache.set(fullUrl, blobUrl);
                                    return blobUrl;
                                }
                            }
                        } catch (fbErr) {
                            // ignore and propagate original error
                        }
                    }
                    throw err;
                }
            })();

            pendingRequests.set(fullUrl, fetchPromise);

            try {
                const finalBlobUrl = await fetchPromise;
                setSrc(finalBlobUrl);
            } catch (err) {
                // If fetch fails (404 / missing media), fallback to clean contextual placeholder
                const fallbackImg = getFallbackImage(fullUrl);
                imageCache.set(fullUrl, fallbackImg);
                setSrc(fallbackImg);
                setError(true);
            } finally {
                pendingRequests.delete(fullUrl);
                setLoaded(true);
            }
        };

        loadImage();
    }, [rawPath]);

    return { src, loaded, error };
};
