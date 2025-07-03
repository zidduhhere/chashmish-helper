/**
 * Plugin Service - Main business logic for the Google Drive Image Scraper
 *
 * This service coordinates between the UI, Google Drive API, and Figma API
 * to provide the complete functionality of scanning and importing images.
 */

import { DriveFile, GoogleDriveService } from "./drive-api";
import { API_CONFIG, ERROR_MESSAGES, DEFAULT_IMPORT_SETTINGS } from "./config";

/**
 * Progress callback interface for UI updates
 */
export interface ProgressCallback {
  (progress: number, status: string): void;
}

/**
 * Scan result interface
 */
export interface ScanResult {
  success: boolean;
  images: DriveFile[];
  error?: string;
  totalFound: number;
  folderName?: string;
}

/**
 * Import result interface
 */
export interface ImportResult {
  success: boolean;
  importedCount: number;
  error?: string;
  nodes: SceneNode[];
}

/**
 * Import options interface
 */
export interface ImportOptions {
  createComponents: boolean;
  imageSize: number;
  spacing: number;
  imagesPerRow: number;
  preserveAspectRatio: boolean;
}

/**
 * Main plugin service class
 */
export class PluginService {
  private driveService: GoogleDriveService;

  constructor() {
    this.driveService = new GoogleDriveService();
  }

  /**
   * Initialize the plugin service
   */
  async initialize(): Promise<void> {
    try {
      await this.driveService.initialize();
      console.log("Plugin service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize plugin service:", error);
      throw error;
    }
  }

  /**
   * Scan a Google Drive folder for images
   */
  async scanFolder(
    folderUrl: string,
    allowedTypes: string[],
    maxImages: number = DEFAULT_IMPORT_SETTINGS.maxImages,
    progressCallback?: ProgressCallback
  ): Promise<ScanResult> {
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
      const folderInfo = await this.driveService.getFolderInfo(folderId);

      if (progressCallback) {
        progressCallback(20, "Scanning folder contents...");
      }

      // Scan folder for files
      const scanResult = await this.driveService.scanFolder(folderId);

      if (progressCallback) {
        progressCallback(60, "Filtering image files...");
      }

      // Filter for image files
      const imageFiles = this.driveService.filterImageFiles(
        scanResult.files,
        allowedTypes
      );

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
        folderName: folderInfo?.name,
      };
    } catch (error) {
      console.error("Error scanning folder:", error);

      return {
        success: false,
        images: [],
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        totalFound: 0,
      };
    }
  }

  /**
   * Import images into Figma (main design editor)
   */
  async importToFigma(
    images: DriveFile[],
    options: Partial<ImportOptions> = {},
    progressCallback?: ProgressCallback
  ): Promise<ImportResult> {
    const settings = { ...DEFAULT_IMPORT_SETTINGS, ...options };
    const nodes: SceneNode[] = [];
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
          const imageData = await this.driveService.downloadFile(image);
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
          } else {
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
        } catch (error) {
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
    } catch (error) {
      console.error("Import error:", error);
      return {
        success: false,
        importedCount: 0,
        error: error instanceof Error ? error.message : "Import failed",
        nodes: [],
      };
    }
  }

  /**
   * Import images into FigJam as sticky notes
   */
  async importToFigJam(
    images: DriveFile[],
    progressCallback?: ProgressCallback
  ): Promise<ImportResult> {
    const nodes: SceneNode[] = [];
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
          progressCallback(
            progress,
            `Creating sticky note for ${image.name}...`
          );
        }

        try {
          // Download image data
          const imageData = await this.driveService.downloadFile(image);
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
        } catch (error) {
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
    } catch (error) {
      console.error("FigJam import error:", error);
      return {
        success: false,
        importedCount: 0,
        error: error instanceof Error ? error.message : "FigJam import failed",
        nodes: [],
      };
    }
  }

  /**
   * Import images into Slides as individual slides
   */
  async importToSlides(
    images: DriveFile[],
    progressCallback?: ProgressCallback
  ): Promise<ImportResult> {
    const slides: SlideNode[] = [];

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
          const imageData = await this.driveService.downloadFile(image);
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
        } catch (error) {
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
    } catch (error) {
      console.error("Slides import error:", error);
      return {
        success: false,
        importedCount: 0,
        error: error instanceof Error ? error.message : "Slides import failed",
        nodes: [],
      };
    }
  }
}

// Export singleton instance
export const pluginService = new PluginService();
