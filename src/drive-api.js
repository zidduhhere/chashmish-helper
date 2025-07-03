/**
 * Google Drive API Service
 *
 * This module handles all Google Drive API interactions including authentication,
 * folder scanning, and file downloading. It provides a clean interface for the
 * main plugin code to interact with Google Drive.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Configuration for Google Drive API
const DRIVE_API_CONFIG = {
    apiKey: "YOUR_GOOGLE_API_KEY", // Replace with your API key
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    scope: "https://www.googleapis.com/auth/drive.readonly",
};
/**
 * Google Drive API service class
 */
export class GoogleDriveService {
    constructor() {
        this.isInitialized = false;
        this.isSignedIn = false;
    }
    /**
     * Initialize the Google Drive API client
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // For Figma plugins, we'll use a simplified approach with API key only
                // This limits us to public files but avoids complex OAuth flow
                this.isInitialized = true;
                console.log("Google Drive API service initialized");
            }
            catch (error) {
                console.error("Failed to initialize Google Drive API:", error);
                throw new Error("Could not initialize Google Drive API");
            }
        });
    }
    /**
     * Extract folder ID from various Google Drive URL formats
     */
    extractFolderId(url) {
        const patterns = [
            // Standard folder sharing URL
            /\/folders\/([a-zA-Z0-9-_]+)/,
            // Direct folder ID parameter
            /[?&]id=([a-zA-Z0-9-_]+)/,
            // Alternative folder URL format
            /\/drive\/folders\/([a-zA-Z0-9-_]+)/,
            // Open folder URL format
            /\/open\?id=([a-zA-Z0-9-_]+)/,
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        console.warn("Could not extract folder ID from URL:", url);
        return null;
    }
    /**
     * Check if the service is ready to make API calls
     */
    isReady() {
        return this.isInitialized;
    }
    /**
     * Scan a Google Drive folder for files
     * Uses the public API approach for publicly shared folders
     */
    scanFolder(folderId, pageToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isInitialized) {
                yield this.initialize();
            }
            try {
                // Build the API URL for listing files in a folder
                let apiUrl = `https://www.googleapis.com/drive/v3/files`;
                apiUrl += `?q='${encodeURIComponent(folderId)}'+in+parents+and+trashed=false`;
                apiUrl += `&fields=files(id,name,mimeType,size,thumbnailLink,webViewLink,createdTime,modifiedTime),nextPageToken`;
                apiUrl += `&pageSize=100`;
                if (pageToken) {
                    apiUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
                }
                console.log("Fetching from Google Drive API:", apiUrl);
                const response = yield fetch(apiUrl);
                if (!response.ok) {
                    const errorText = yield response.text();
                    console.error("API Error Response:", errorText);
                    // Try alternative approach for public folders
                    if (response.status === 401 || response.status === 403) {
                        return this.scanPublicFolder(folderId);
                    }
                    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
                }
                const data = yield response.json();
                // Transform the response to our DriveFile format
                const files = (data.files || []).map((file) => ({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    size: file.size,
                    thumbnailLink: file.thumbnailLink,
                    webViewLink: file.webViewLink,
                    downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
                    createdTime: file.createdTime,
                    modifiedTime: file.modifiedTime,
                }));
                return {
                    files,
                    nextPageToken: data.nextPageToken,
                    incompleteSearch: data.incompleteSearch,
                };
            }
            catch (error) {
                console.error("Error scanning Google Drive folder:", error);
                throw error;
            }
        });
    }
    /**
     * Alternative method for public folders using web scraping approach
     * This is a fallback when the API doesn't work
     */
    scanPublicFolder(folderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use the public folder view URL
                const publicUrl = `https://drive.google.com/drive/folders/${folderId}`;
                // For Figma plugins, we can't do traditional web scraping
                // So we'll return a limited response suggesting the user check folder permissions
                console.warn("Falling back to public folder access - limited functionality");
                return {
                    files: [],
                    nextPageToken: undefined,
                    incompleteSearch: true,
                };
            }
            catch (error) {
                console.error("Public folder scan failed:", error);
                throw new Error("Could not access folder. Please ensure it is publicly accessible.");
            }
        });
    }
    /**
     * Filter files by type (images only)
     */
    filterImageFiles(files, allowedTypes) {
        const imageExtensions = {
            jpg: ["image/jpeg", "image/jpg"],
            jpeg: ["image/jpeg", "image/jpg"],
            png: ["image/png"],
            gif: ["image/gif"],
            svg: ["image/svg+xml"],
            webp: ["image/webp"],
            bmp: ["image/bmp"],
            tiff: ["image/tiff"],
        };
        return files.filter((file) => {
            const fileName = file.name.toLowerCase();
            const mimeType = file.mimeType.toLowerCase();
            // Check by MIME type first (most reliable)
            for (const type of allowedTypes) {
                const validMimeTypes = imageExtensions[type.toLowerCase()];
                if (validMimeTypes && validMimeTypes.indexOf(mimeType) !== -1) {
                    return true;
                }
            }
            // Fallback: check by file extension
            for (const type of allowedTypes) {
                if (fileName.endsWith(`.${type.toLowerCase()}`)) {
                    return true;
                }
            }
            return false;
        });
    }
    /**
     * Download file content as ArrayBuffer
     */
    downloadFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!file.downloadUrl) {
                throw new Error(`No download URL available for ${file.name}`);
            }
            try {
                console.log(`Downloading file: ${file.name}`);
                const response = yield fetch(file.downloadUrl);
                if (!response.ok) {
                    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
                }
                return yield response.arrayBuffer();
            }
            catch (error) {
                console.error(`Failed to download ${file.name}:`, error);
                throw error;
            }
        });
    }
    /**
     * Get folder information
     */
    getFolderInfo(folderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const apiUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,webViewLink,createdTime,modifiedTime`;
                const response = yield fetch(apiUrl);
                if (!response.ok) {
                    return null;
                }
                const data = yield response.json();
                return {
                    id: data.id,
                    name: data.name,
                    mimeType: data.mimeType,
                    webViewLink: data.webViewLink,
                    createdTime: data.createdTime,
                    modifiedTime: data.modifiedTime,
                };
            }
            catch (error) {
                console.error("Failed to get folder info:", error);
                return null;
            }
        });
    }
}
// Export a singleton instance
export const driveService = new GoogleDriveService();
