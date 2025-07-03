/**
 * Plugin Service - Main business logic for the Google Drive Image Scraper
 *
 * This service coordinates between the UI, Google Drive API, and Figma API
 * to provide the complete functionality of scanning and importing images.
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
import { GoogleDriveService } from "./drive-api";
import { ERROR_MESSAGES, DEFAULT_IMPORT_SETTINGS } from "./config";
/**
 * Main plugin service class
 */
export class PluginService {
    constructor() {
        this.driveService = new GoogleDriveService();
    }
    /**
     * Initialize the plugin service
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.driveService.initialize();
                console.log("Plugin service initialized successfully");
            }
            catch (error) {
                console.error("Failed to initialize plugin service:", error);
                throw error;
            }
        });
    }
    /**
     * Scan a Google Drive folder for images
     */
    scanFolder(folderUrl_1, allowedTypes_1) {
        return __awaiter(this, arguments, void 0, function* (folderUrl, allowedTypes, maxImages = DEFAULT_IMPORT_SETTINGS.maxImages, progressCallback) {
            try {
                // Update progress
                if (progressCallback) {
                    progressCallback(0, "Extracting folder ID...");
                }
                // Extract folder ID from URL
                const folderId = this.driveService.extractFolderId(folderUrl);
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
                const folderInfo = yield this.driveService.getFolderInfo(folderId);
                if (progressCallback) {
                    progressCallback(20, "Scanning folder contents...");
                }
                // Scan folder for files
                const scanResult = yield this.driveService.scanFolder(folderId);
                if (progressCallback) {
                    progressCallback(60, "Filtering image files...");
                }
                // Filter for image files
                const imageFiles = this.driveService.filterImageFiles(scanResult.files, allowedTypes);
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
    importToFigma(images_1) {
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
                        const imageData = yield this.driveService.downloadFile(image);
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
    importToFigJam(images, progressCallback) {
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
                        const imageData = yield this.driveService.downloadFile(image);
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
    importToSlides(images, progressCallback) {
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
                        const imageData = yield this.driveService.downloadFile(image);
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
}
// Export singleton instance
export const pluginService = new PluginService();
