// services/config.js
// ===========================
// 🌐 API CONFIGURATION
// ===========================

// ✅ Base URL ONLY (Django backend via Ngrok)
export const API_BASE_URL = "https://affecting-tingling-duke.ngrok-free.dev";

// ✅ Production Fallback API Base (When local ngrok backend is offline/unreachable)
export const FALLBACK_API_BASE_URL = "https://api.codingboss.in";

// ✅ Vandanmart API Base & Gateways
export const VANDANMART_API_BASE_URL = "https://api.codingboss.in/vandanmart";
export const HERBAL_API_BASE_URL = "https://api.codingboss.in/herbal";

// ✅ Primary Media Base: Active backend (local Django uploads via Ngrok)
export const MEDIA_BASE_URL = API_BASE_URL;

// ✅ Production Media Fallback CDN (For seed assets if missing locally)
export const FALLBACK_MEDIA_BASE_URL = "https://api.codingboss.in";

// ✅ E-commerce API base path
export const ECOM_API_PATH = "/ecomapp/";

// ✅ Common headers for all requests
export const COMMON_HEADERS = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
};

// ===========================
// 🖼 IMAGE URL HELPER (FIXED)
// ===========================
export const getImageUrl = (path) => {
    // 1️⃣ No image from API or empty data
    if (!path || path === "" || path === "null" || path === "undefined") {
        return "/images/no-image.png";
    }

    let finalPath = String(path).trim();
    const lowerPath = finalPath.toLowerCase();

    // 2️⃣ Override known local seed images or missing/broken backend files (applies to both relative & absolute URLs)
    if (
        lowerPath.includes("auto_1clwsky") ||
        lowerPath.includes("category_images/auto") ||
        lowerPath.includes("vehicle_auto") ||
        (lowerPath.includes("auto") && (lowerPath.includes("category") || lowerPath.includes("vehicle") || lowerPath.includes(".jp")))
    ) {
        return "/vehicle_auto.png";
    }
    if (lowerPath.includes("ambulance") && (lowerPath.includes("category") || lowerPath.includes("vehicle") || lowerPath.includes("service"))) {
        return "/vehicle_ambulance.png";
    }
    if (lowerPath.includes("puncture") && (lowerPath.includes("category") || lowerPath.includes("vehicle") || lowerPath.includes("service"))) {
        return "/vehicle_puncture.png";
    }
    if (lowerPath.includes("car_wash")) {
        return "/vehicle_auto.png";
    }
    if (lowerPath.includes("pvr.jpg")) {
        return "/images/categories/grocery.png";
    }
    if (lowerPath.includes("coffee.jpg") || lowerPath.includes("tea.jpg") || lowerPath.includes("snacks.jpg")) {
        return "/images/subcategories/snacks-beverages.png";
    }
    if (lowerPath.includes("oil.jpg")) {
        return "/images/subcategories/edible-oils.png";
    }
    if (lowerPath.includes("rice.jpg")) {
        return "/images/subcategories/grains-pulses.png";
    }
    if (lowerPath.includes("cooking_essential.jpg")) {
        return "/images/subcategories/organic-staples.png";
    }

    // 3️⃣ Local Static / Public Assets (Frontend Vite assets in public/)
    const cleanPath = finalPath.startsWith("/") ? finalPath.substring(1) : finalPath;
    if (
        cleanPath.startsWith("images/") ||
        cleanPath.startsWith("categories/") ||
        cleanPath.startsWith("banners/") ||
        cleanPath.startsWith("enthiran_") ||
        cleanPath.startsWith("card_") ||
        cleanPath.startsWith("vehicle_") ||
        cleanPath.startsWith("kuiky-") ||
        cleanPath.startsWith("vite.") ||
        cleanPath.startsWith("media/subcategory_images/") ||
        cleanPath.startsWith("media/category_images/")
    ) {
        return `/${cleanPath}`;
    }

    // 4️⃣ Handle Absolute URLs from Backend
    if (finalPath.startsWith("http://") || finalPath.startsWith("https://")) {
        // Force HTTPS to avoid Mixed Content blocker in modern browsers
        if (finalPath.startsWith("http://")) {
            finalPath = finalPath.replace("http://", "https://");
        }

        // If it was mistakenly pointed to codingboss for local public assets (like /images/categories/...)
        if (finalPath.includes("api.codingboss.in/images/") || finalPath.includes("api.codingboss.in/categories/")) {
            const localRel = finalPath.replace(/https?:\/\/api\.codingboss\.in\//, "");
            return `/${localRel}`;
        }

        // If backend returns a localhost or 127.0.0.1 URL for media,
        // redirect to active MEDIA_BASE_URL so images load reliably across devices
        if (
            finalPath.includes("localhost") ||
            finalPath.includes("127.0.0.1")
        ) {
            const pathParts = finalPath.split("/");
            const mediaIndex = pathParts.findIndex(p => p === "media" || p === "static");
            if (mediaIndex !== -1) {
                const relativePath = pathParts.slice(mediaIndex).join("/");
                const baseMedia = MEDIA_BASE_URL.endsWith("/") ? MEDIA_BASE_URL.slice(0, -1) : MEDIA_BASE_URL;
                return `${baseMedia}/${relativePath}`;
            }
        }

        return finalPath; // Already valid absolute URL (e.g. ngrok, Cloudinary, S3, or codingboss)
    }

    // 5️⃣ Construct Media CDN URL from relative path for Django uploaded media (e.g. /media/product_images/NAAN.jpg)
    const baseMedia = MEDIA_BASE_URL.endsWith("/") ? MEDIA_BASE_URL.slice(0, -1) : MEDIA_BASE_URL;

    return `${baseMedia}/${cleanPath}`;
};
