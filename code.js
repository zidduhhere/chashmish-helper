"use strict";
/**
 * Google Drive Image Scraper Plugin for Figma
 *
 * This plugin allows users to scan Google Drive folders for images and import them
 * directly into Figma, FigJam, or Slides. It uses a proper Google Drive API integration
 * with all functionality consolidated into a single file for Figma plugin compatibility.
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
// ============================================================================
// CONFIGURATION AND CONSTANTS
// ============================================================================
/**
 * Configuration for Google Drive API integration
 */
const API_CONFIG = {
    // Add your Google API key here for public folder access
    // Get it from: https://console.cloud.google.com/apis/credentials
    apiKey: "AIzaSyAXJTvO1IJYulvOe6_SCbKIfjXoDcVKxG8", // Replace with your actual API key
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
 * Default import settings
 */
const DEFAULT_IMPORT_SETTINGS = {
    maxImages: 50,
    imageSize: 200, // pixels
    spacing: 20, // pixels
    imagesPerRow: 3,
    createComponents: false,
    preserveAspectRatio: true,
};
/**
 * Error messages for common API issues
 */
const ERROR_MESSAGES = {
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
const FILE_TYPE_MAPPINGS = {
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
// ============================================================================
// MAIN PLUGIN LOGIC
// ============================================================================
/**
 * Handle progress updates from the plugin service
 */
function createProgressCallback() {
    return (progress, status) => {
        figma.ui.postMessage({
            type: "scan-progress",
            progress,
            status,
        });
    };
}
/**
 * Handle import progress updates
 */
function createImportProgressCallback() {
    return (progress, status) => {
        figma.ui.postMessage({
            type: "import-progress",
            progress,
            status,
        });
    };
}
/**
 * FIGMA EDITOR HANDLER
 * Handles image import for the main Figma design editor
 * Creates rectangles with image fills or components based on user preference
 */
if (figma.editorType === "figma") {
    figma.showUI(__html__, { width: 600, height: 900 });
    // Plugin initialized automatically when editor loads
    figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (msg.type === "scan-drive") {
                console.log("Scanning Google Drive folder:", msg.data.url);
                const result = yield scanFolder(msg.data.url, msg.data.imageTypes, msg.data.maxImages, createProgressCallback());
                if (result.success) {
                    figma.ui.postMessage({
                        type: "scan-complete",
                        images: result.images,
                        totalFound: result.totalFound,
                        folderName: result.folderName,
                    });
                }
                else {
                    figma.ui.postMessage({
                        type: "error",
                        message: result.error || "Failed to scan folder",
                    });
                }
            }
            else if (msg.type === "import-images") {
                console.log(`Importing ${msg.data.images.length} images to Figma`);
                const importOptions = {
                    createComponents: msg.data.createComponents,
                    imageSize: msg.data.imageSize || DEFAULT_IMPORT_SETTINGS.imageSize,
                    spacing: msg.data.spacing || DEFAULT_IMPORT_SETTINGS.spacing,
                    imagesPerRow: msg.data.imagesPerRow || DEFAULT_IMPORT_SETTINGS.imagesPerRow,
                    preserveAspectRatio: DEFAULT_IMPORT_SETTINGS.preserveAspectRatio,
                };
                const result = yield importToFigma(msg.data.images, importOptions, createImportProgressCallback());
                if (result.success) {
                    figma.ui.postMessage({
                        type: "import-complete",
                        count: result.importedCount,
                    });
                }
                else {
                    figma.ui.postMessage({
                        type: "error",
                        message: result.error || "Failed to import images",
                    });
                }
            }
        }
        catch (error) {
            console.error("Plugin error:", error);
            figma.ui.postMessage({
                type: "error",
                message: error instanceof Error ? error.message : "An unknown error occurred",
            });
        }
    });
}
/**
 * FIGJAM EDITOR HANDLER
 * Handles image import for FigJam collaborative whiteboard
 * Creates sticky notes with image previews for better collaboration context
 */
if (figma.editorType === "figjam") {
    figma.showUI(__html__);
    // Plugin initialized automatically when editor loads
    figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (msg.type === "scan-drive") {
                console.log("Scanning Google Drive folder for FigJam:", msg.data.url);
                const result = yield scanFolder(msg.data.url, msg.data.imageTypes, msg.data.maxImages, createProgressCallback());
                if (result.success) {
                    figma.ui.postMessage({
                        type: "scan-complete",
                        images: result.images,
                        totalFound: result.totalFound,
                        folderName: result.folderName,
                    });
                }
                else {
                    figma.ui.postMessage({
                        type: "error",
                        message: result.error || "Failed to scan folder",
                    });
                }
            }
            else if (msg.type === "import-images") {
                console.log(`Importing ${msg.data.images.length} images to FigJam`);
                const result = yield importToFigJam(msg.data.images, createImportProgressCallback());
                if (result.success) {
                    figma.ui.postMessage({
                        type: "import-complete",
                        count: result.importedCount,
                    });
                }
                else {
                    figma.ui.postMessage({
                        type: "error",
                        message: result.error || "Failed to import images",
                    });
                }
            }
        }
        catch (error) {
            console.error("FigJam plugin error:", error);
            figma.ui.postMessage({
                type: "error",
                message: error instanceof Error ? error.message : "An unknown error occurred",
            });
        }
    });
}
/**
 * SLIDES EDITOR HANDLER
 * Handles image import for Figma Slides presentation mode
 * Creates new slides with centered images for presentation layouts
 */
if (figma.editorType === "slides") {
    figma.showUI(__html__);
    // Plugin initialized automatically when editor loads
    figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (msg.type === "scan-drive") {
                console.log("Scanning Google Drive folder for Slides:", msg.data.url);
                const result = yield scanFolder(msg.data.url, msg.data.imageTypes, msg.data.maxImages, createProgressCallback());
                if (result.success) {
                    figma.ui.postMessage({
                        type: "scan-complete",
                        images: result.images,
                        totalFound: result.totalFound,
                        folderName: result.folderName,
                    });
                }
                else {
                    figma.ui.postMessage({
                        type: "error",
                        message: result.error || "Failed to scan folder",
                    });
                }
            }
            else if (msg.type === "import-images") {
                console.log(`Importing ${msg.data.images.length} images to Slides`);
                const result = yield importToSlides(msg.data.images, createImportProgressCallback());
                if (result.success) {
                    figma.ui.postMessage({
                        type: "import-complete",
                        count: result.importedCount,
                    });
                }
                else {
                    figma.ui.postMessage({
                        type: "error",
                        message: result.error || "Failed to import images",
                    });
                }
            }
        }
        catch (error) {
            console.error("Slides plugin error:", error);
            figma.ui.postMessage({
                type: "error",
                message: error instanceof Error ? error.message : "An unknown error occurred",
            });
        }
    });
}
// ============================================================================
// GOOGLE DRIVE API SERVICE FUNCTIONS
// ============================================================================
/**
 * Extract folder ID from various Google Drive URL formats
 */
function extractFolderId(url) {
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
 * Filter files by type (images only)
 */
function filterImageFiles(files, allowedTypes) {
    return files.filter((file) => {
        const fileName = file.name.toLowerCase();
        const mimeType = file.mimeType.toLowerCase();
        // Check by MIME type first (most reliable)
        for (const type of allowedTypes) {
            const validMimeTypes = FILE_TYPE_MAPPINGS[type.toLowerCase()];
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
 * Scan a Google Drive folder for files
 * Uses the public API approach for publicly shared folders
 */
function scanGoogleDriveFolder(folderId, pageToken) {
    return __awaiter(this, void 0, void 0, function* () {
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
                if (response.status === 401 || response.status === 403) {
                    throw new Error(ERROR_MESSAGES.FOLDER_NOT_FOUND);
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
 * Download file content as ArrayBuffer
 */
function downloadFile(file) {
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
function getFolderInfo(folderId) {
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
// ============================================================================
// PLUGIN SERVICE FUNCTIONS
// ============================================================================
/**
 * Scan a Google Drive folder for images
 */
function scanFolder(folderUrl_1, allowedTypes_1) {
    return __awaiter(this, arguments, void 0, function* (folderUrl, allowedTypes, maxImages = DEFAULT_IMPORT_SETTINGS.maxImages, progressCallback) {
        try {
            // Update progress
            if (progressCallback) {
                progressCallback(0, "Extracting folder ID...");
            }
            // Extract folder ID from URL
            const folderId = extractFolderId(folderUrl);
            if (!folderId) {
                return {
                    success: false,
                    images: [],
                    error: ERROR_MESSAGES.INVALID_URL,
                    totalFound: 0,
                };
            }
            if (progressCallback) {
                progressCallback(10, "Connecting to Google Drive...");
            }
            // Get folder information
            const folderInfo = yield getFolderInfo(folderId);
            if (progressCallback) {
                progressCallback(20, "Scanning folder contents...");
            }
            // Scan folder for files
            const scanResult = yield scanGoogleDriveFolder(folderId);
            if (progressCallback) {
                progressCallback(60, "Filtering image files...");
            }
            // Filter for image files
            const imageFiles = filterImageFiles(scanResult.files, allowedTypes);
            if (progressCallback) {
                progressCallback(80, "Processing results...");
            }
            // Limit results based on maxImages setting
            const limitedImages = imageFiles.slice(0, maxImages);
            if (progressCallback) {
                progressCallback(100, `Found ${limitedImages.length} images`);
            }
            return {
                success: true,
                images: limitedImages,
                totalFound: imageFiles.length,
                folderName: folderInfo === null || folderInfo === void 0 ? void 0 : folderInfo.name,
            };
        }
        catch (error) {
            console.error("Error scanning folder:", error);
            return {
                success: false,
                images: [],
                error: error instanceof Error ? error.message : "Unknown error occurred",
                totalFound: 0,
            };
        }
    });
}
/**
 * Import images into Figma (main design editor)
 */
function importToFigma(images_1) {
    return __awaiter(this, arguments, void 0, function* (images, options = {}, progressCallback) {
        const settings = Object.assign(Object.assign({}, DEFAULT_IMPORT_SETTINGS), options);
        const nodes = [];
        let currentX = 0;
        let currentY = 0;
        try {
            if (progressCallback) {
                progressCallback(0, "Starting import...");
            }
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const progress = (i / images.length) * 100;
                if (progressCallback) {
                    progressCallback(progress, `Importing ${image.name}...`);
                }
                try {
                    // Download image data
                    const imageData = yield downloadFile(image);
                    const uint8Array = new Uint8Array(imageData);
                    // Create image in Figma
                    const imageHash = figma.createImage(uint8Array);
                    const rect = figma.createRectangle();
                    // Set image fill
                    rect.fills = [
                        {
                            type: "IMAGE",
                            imageHash: imageHash.hash,
                            scaleMode: settings.preserveAspectRatio ? "FIT" : "FILL",
                        },
                    ];
                    // Position and size the rectangle
                    rect.x = currentX;
                    rect.y = currentY;
                    rect.resize(settings.imageSize, settings.imageSize);
                    rect.name = image.name;
                    if (settings.createComponents) {
                        // Create a component
                        const component = figma.createComponent();
                        component.appendChild(rect);
                        component.x = currentX;
                        component.y = currentY;
                        component.name = image.name;
                        figma.currentPage.appendChild(component);
                        nodes.push(component);
                    }
                    else {
                        // Create a simple rectangle
                        figma.currentPage.appendChild(rect);
                        nodes.push(rect);
                    }
                    // Update position for next image
                    currentX += settings.imageSize + settings.spacing;
                    if ((i + 1) % settings.imagesPerRow === 0) {
                        currentX = 0;
                        currentY += settings.imageSize + settings.spacing;
                    }
                }
                catch (error) {
                    console.error(`Failed to import ${image.name}:`, error);
                    // Continue with next image
                }
            }
            // Select and focus imported nodes
            if (nodes.length > 0) {
                figma.currentPage.selection = nodes;
                figma.viewport.scrollAndZoomIntoView(nodes);
            }
            if (progressCallback) {
                progressCallback(100, `Imported ${nodes.length} images`);
            }
            return {
                success: true,
                importedCount: nodes.length,
                nodes,
            };
        }
        catch (error) {
            console.error("Import error:", error);
            return {
                success: false,
                importedCount: 0,
                error: error instanceof Error ? error.message : "Import failed",
                nodes: [],
            };
        }
    });
}
/**
 * Import images into FigJam as sticky notes
 */
function importToFigJam(images, progressCallback) {
    return __awaiter(this, void 0, void 0, function* () {
        const nodes = [];
        let currentX = 0;
        let currentY = 0;
        const spacing = 50;
        try {
            if (progressCallback) {
                progressCallback(0, "Starting FigJam import...");
            }
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const progress = (i / images.length) * 100;
                if (progressCallback) {
                    progressCallback(progress, `Creating sticky note for ${image.name}...`);
                }
                try {
                    // Download image data
                    const imageData = yield downloadFile(image);
                    const uint8Array = new Uint8Array(imageData);
                    // Create sticky note
                    const sticky = figma.createSticky();
                    sticky.x = currentX;
                    sticky.y = currentY;
                    sticky.text.characters = image.name;
                    // Create image rectangle above sticky note
                    const imageHash = figma.createImage(uint8Array);
                    const rect = figma.createRectangle();
                    rect.fills = [
                        {
                            type: "IMAGE",
                            imageHash: imageHash.hash,
                            scaleMode: "FIT",
                        },
                    ];
                    rect.resize(150, 150);
                    rect.x = currentX;
                    rect.y = currentY - 170;
                    rect.name = `${image.name} (Image)`;
                    figma.currentPage.appendChild(sticky);
                    figma.currentPage.appendChild(rect);
                    nodes.push(sticky, rect);
                    // Update position
                    currentX += 200;
                    if (currentX > 1000) {
                        currentX = 0;
                        currentY += 250;
                    }
                }
                catch (error) {
                    console.error(`Failed to import ${image.name} to FigJam:`, error);
                }
            }
            if (nodes.length > 0) {
                figma.currentPage.selection = nodes;
                figma.viewport.scrollAndZoomIntoView(nodes);
            }
            if (progressCallback) {
                progressCallback(100, `Created ${nodes.length / 2} sticky notes`);
            }
            return {
                success: true,
                importedCount: nodes.length / 2,
                nodes,
            };
        }
        catch (error) {
            console.error("FigJam import error:", error);
            return {
                success: false,
                importedCount: 0,
                error: error instanceof Error ? error.message : "FigJam import failed",
                nodes: [],
            };
        }
    });
}
/**
 * Import images into Slides as individual slides
 */
function importToSlides(images, progressCallback) {
    return __awaiter(this, void 0, void 0, function* () {
        const slides = [];
        try {
            if (progressCallback) {
                progressCallback(0, "Creating slides...");
            }
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const progress = (i / images.length) * 100;
                if (progressCallback) {
                    progressCallback(progress, `Creating slide for ${image.name}...`);
                }
                try {
                    // Create new slide
                    const slide = figma.createSlide();
                    slide.name = image.name;
                    // Download image data
                    const imageData = yield downloadFile(image);
                    const uint8Array = new Uint8Array(imageData);
                    // Create image on slide
                    const imageHash = figma.createImage(uint8Array);
                    const rect = figma.createRectangle();
                    rect.fills = [
                        {
                            type: "IMAGE",
                            imageHash: imageHash.hash,
                            scaleMode: "FIT",
                        },
                    ];
                    // Center image on slide
                    const slideWidth = slide.width || 1920;
                    const slideHeight = slide.height || 1080;
                    const imageWidth = Math.min(800, slideWidth * 0.8);
                    const imageHeight = Math.min(600, slideHeight * 0.8);
                    rect.resize(imageWidth, imageHeight);
                    rect.x = (slideWidth - imageWidth) / 2;
                    rect.y = (slideHeight - imageHeight) / 2;
                    rect.name = image.name;
                    slide.appendChild(rect);
                    slides.push(slide);
                }
                catch (error) {
                    console.error(`Failed to create slide for ${image.name}:`, error);
                }
            }
            if (slides.length > 0) {
                figma.currentPage.selection = slides;
                figma.viewport.slidesView = "grid";
            }
            if (progressCallback) {
                progressCallback(100, `Created ${slides.length} slides`);
            }
            return {
                success: true,
                importedCount: slides.length,
                nodes: slides,
            };
        }
        catch (error) {
            console.error("Slides import error:", error);
            return {
                success: false,
                importedCount: 0,
                error: error instanceof Error ? error.message : "Slides import failed",
                nodes: [],
            };
        }
    });
}
// ============================================================================
// PLUGIN MESSAGE INTERFACES
// ============================================================================
