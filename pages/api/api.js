import axiosInstance from '../../axios/axios';

// Replace with the correct adminId where needed

// TV Browser Compatible Fetch Helper (using XMLHttpRequest)
const tvBrowserFetch = (url, headers = {}) => {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        const baseURL = process.env.NEXT_PUBLIC_URL || '';
        const fullUrl = baseURL + url;
        
        xhr.open("GET", fullUrl, true);
        xhr.timeout = 30000; // 30 second timeout for TV browsers
        
        // Set headers
        xhr.setRequestHeader("Content-Type", "application/json");
        if (process.env.NEXT_PUBLIC_API_KEY) {
            xhr.setRequestHeader("X-Secret-Key", process.env.NEXT_PUBLIC_API_KEY);
        }
        Object.keys(headers).forEach(key => {
            xhr.setRequestHeader(key, headers[key]);
        });
        
        xhr.withCredentials = true;
        
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    // Format response to match axios structure
                    resolve({ data: data });
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            } else {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            }
        };
        
        xhr.onerror = function () {
            reject(new Error("NETWORK_ERROR"));
        };
        
        xhr.ontimeout = function () {
            reject(new Error("TIMEOUT"));
        };
        
        xhr.send();
    });
};

// Detect if running on TV browser (basic detection)
const isTVBrowser = () => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    // Common TV browser indicators
    return ua.includes('smart-tv') || 
           ua.includes('smarttv') || 
           ua.includes('tizen') || 
           ua.includes('webos') ||
           ua.includes('tv') ||
           (window.screen && window.screen.width >= 1920 && window.screen.height >= 1080 && !window.navigator.userAgent.includes('Mobile'));
};

// Fetch spot rates for the given adminId (with TV browser fallback)
export const fetchSpotRates = (adminId) => {
    // Try axios first, fallback to XMLHttpRequest for TV browsers
    if (isTVBrowser()) {
        console.log('TV Browser detected, using XMLHttpRequest for fetchSpotRates');
        return tvBrowserFetch(`/get-spotrates/${adminId}`);
    }
    
    return axiosInstance.get(`/get-spotrates/${adminId}`).catch((error) => {
        // If axios fails, try XMLHttpRequest fallback
        console.warn('Axios failed, falling back to XMLHttpRequest:', error);
        return tvBrowserFetch(`/get-spotrates/${adminId}`);
    });
};

// Fetch server URL (with TV browser fallback)
export const fetchServerURL = async () => {
    // Try axios first, fallback to XMLHttpRequest for TV browsers
    if (isTVBrowser()) {
        console.log('TV Browser detected, using XMLHttpRequest for fetchServerURL');
        return tvBrowserFetch('/get-server');
    }
    
    try {
        const response = await axiosInstance.get('/get-server');
        return response;
    } catch (error) {
        console.warn('Axios failed, falling back to XMLHttpRequest:', error);
        // Fallback to XMLHttpRequest
        return tvBrowserFetch('/get-server');
    }
};


// Fetch news for the given adminId (with TV browser fallback)
export const fetchNews = (adminId) => {
    // Try axios first, fallback to XMLHttpRequest for TV browsers
    if (isTVBrowser()) {
        console.log('TV Browser detected, using XMLHttpRequest for fetchNews');
        return tvBrowserFetch(`/get-news/${adminId}`);
    }
    
    return axiosInstance.get(`/get-news/${adminId}`).catch((error) => {
        // If axios fails, try XMLHttpRequest fallback
        console.warn('Axios failed, falling back to XMLHttpRequest:', error);
        return tvBrowserFetch(`/get-news/${adminId}`);
    });
};


// Fetch TV screen data
// export const fetchTVScreenData = (adminId) => {
//     return axiosInstance.get('/tv-screen', {
//         headers: { 'admin-id': adminId }
//     });
// };

export function fetchTVScreenData(adminId) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/tv-screen", true);
        xhr.setRequestHeader("admin-id", adminId);

        xhr.onload = function () {
            if (xhr.status === 200) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(xhr.status);
            }
        };

        xhr.onerror = function () {
            reject("NETWORK_ERROR");
        };

        xhr.send();
    });
}