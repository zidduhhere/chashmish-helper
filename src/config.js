/**
 * Configuration file for Google Drive API integration
 *
 * This file contains all the configuration needed for the Google Drive API,
 * including API keys, scopes, and other settings.
 */
/**
 * Default configuration for Google Drive API
 *
 * To use this plugin with authentication:
 * 1. Go to Google Cloud Console
 * 2. Create a new project or select existing
 * 3. Enable Google Drive API
 * 4. Create credentials (API Key for public access, OAuth2 for private)
 * 5. Add your credentials below
 */
export const API_CONFIG = {
    // Add your Google API key here for public folder access
    // Get it from: https://console.cloud.google.com/apis/credentials
    // Note: In production, you should use environment variables or secure storage
    apiKey: "", // Replace with your actual API key
    // For OAuth2 authentication (private folders)
    clientId: "", // Replace with your OAuth2 client ID
    // Google Drive API discovery document
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    // Required scope for reading Drive files
    scope: "https://www.googleapis.com/auth/drive.readonly",
    // Retry configuration for failed requests
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    // Maximum file size to download (10MB)
    maxFileSize: 10 * 1024 * 1024,
    // Supported image MIME types
    allowedMimeTypes: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/svg+xml",
        "image/webp",
        "image/bmp",
        "image/tiff",
    ],
};
/**
 * API endpoints for Google Drive
 */
export const DRIVE_ENDPOINTS = {
    files: "https://www.googleapis.com/drive/v3/files",
    download: "https://www.googleapis.com/drive/v3/files/{fileId}?alt=media",
    publicDownload: "https://drive.google.com/uc?export=download&id={fileId}",
    thumbnail: "https://drive.google.com/thumbnail?id={fileId}",
    webView: "https://drive.google.com/file/d/{fileId}/view",
};
/**
 * Error messages for common API issues
 */
export const ERROR_MESSAGES = {
    INVALID_URL: "Invalid Google Drive folder URL. Please check the URL and try again.",
    FOLDER_NOT_FOUND: "Folder not found or not accessible. Make sure the folder is publicly shared.",
    API_KEY_MISSING: "Google API key is required for accessing Drive files.",
    RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
    NETWORK_ERROR: "Network error occurred. Please check your internet connection.",
    FILE_TOO_LARGE: "File is too large to import. Maximum size is 10MB.",
    UNSUPPORTED_FORMAT: "Unsupported file format. Only image files are supported.",
    AUTHENTICATION_REQUIRED: "Authentication required to access this folder.",
};
/**
 * File type mappings for better type detection
 */
export const FILE_TYPE_MAPPINGS = {
    jpg: ["image/jpeg", "image/jpg"],
    jpeg: ["image/jpeg", "image/jpg"],
    png: ["image/png"],
    gif: ["image/gif"],
    svg: ["image/svg+xml", "text/xml"],
    webp: ["image/webp"],
    bmp: ["image/bmp", "image/x-ms-bmp"],
    tiff: ["image/tiff", "image/tif"],
    ico: ["image/x-icon", "image/vnd.microsoft.icon"],
};
/**
 * Default import settings
 */
export const DEFAULT_IMPORT_SETTINGS = {
    maxImages: 50,
    imageSize: 200, // pixels
    spacing: 20, // pixels
    imagesPerRow: 3,
    createComponents: false,
    preserveAspectRatio: true,
};
