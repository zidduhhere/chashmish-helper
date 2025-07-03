# Migration Guide: From Puppeteer to Google Drive API

This guide explains the transformation from the original Puppeteer-based scraper to the new Google Drive API implementation.

## 🔄 Architecture Transformation

### Before: Puppeteer Approach

```typescript
// Original implementation
import puppeteer from "puppeteer";
import fs from "fs";
import https from "https";

// Browser automation
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(folderUrl);

// DOM scraping
const files = await page.$$eval('div[role="listitem"]', (elements) =>
  elements.map((el) => extractFileInfo(el))
);

// File system operations
const file = fs.createWriteStream(filename);
https.get(url, (response) => response.pipe(file));
```

### After: API Approach

```typescript
// New implementation
import { GoogleDriveService } from "./src/drive-api";
import { PluginService } from "./src/plugin-service";

// Direct API calls
const driveService = new GoogleDriveService();
const result = await driveService.scanFolder(folderId);

// In-memory processing
const imageData = await driveService.downloadFile(file);
const imageHash = figma.createImage(new Uint8Array(imageData));
```

## 🚀 Key Improvements

### 1. Reliability

| Aspect                   | Puppeteer                | API Approach               |
| ------------------------ | ------------------------ | -------------------------- |
| **Browser Dependencies** | Chrome/Chromium required | Browser-independent        |
| **DOM Changes**          | Breaks with UI updates   | Stable API contract        |
| **Rate Limiting**        | Unpredictable            | Documented limits          |
| **Error Handling**       | Page crashes             | Structured error responses |

### 2. Performance

| Metric               | Puppeteer          | API Approach         |
| -------------------- | ------------------ | -------------------- |
| **Startup Time**     | ~2-3 seconds       | ~100ms               |
| **Memory Usage**     | ~100MB+ (browser)  | ~10MB                |
| **Network Overhead** | Full page loads    | Direct data requests |
| **Concurrency**      | Limited by browser | API rate limits      |

### 3. Maintainability

| Factor                | Puppeteer         | API Approach        |
| --------------------- | ----------------- | ------------------- |
| **Code Organization** | Single file       | Modular services    |
| **Testing**           | Complex E2E only  | Unit + Integration  |
| **Debugging**         | Browser devtools  | Standard logging    |
| **Dependencies**      | Heavy (Puppeteer) | Lightweight (fetch) |

## 🔧 Code Comparison

### URL Processing

```typescript
// Before: Regex extraction from scraped content
const match = file.link.match(/[-\w]{25,}/);
const fileId = match ? match[0] : null;

// After: Multiple pattern matching
const patterns = [
  /\/folders\/([a-zA-Z0-9-_]+)/,
  /id=([a-zA-Z0-9-_]+)/,
  /\/drive\/folders\/([a-zA-Z0-9-_]+)/,
];
```

### File Detection

```typescript
// Before: Limited to scraped DOM attributes
const name = el.querySelector("div[aria-label]")?.getAttribute("aria-label");

// After: Rich metadata from API
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
}
```

### Download Process

```typescript
// Before: File system operations
const downloadFile = (url: string, filename: string) => {
  const file = fs.createWriteStream(filename);
  return new Promise<void>((resolve, reject) => {
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
    });
  });
};

// After: In-memory processing for Figma
const downloadFile = async (file: DriveFile): Promise<ArrayBuffer> => {
  const response = await fetch(file.downloadUrl!);
  return await response.arrayBuffer();
};
```

## 🎯 Feature Mapping

### Core Functionality

| Feature             | Puppeteer Implementation | API Implementation        |
| ------------------- | ------------------------ | ------------------------- |
| **Folder Scanning** | DOM parsing              | `drive.files.list` API    |
| **File Filtering**  | Extension checking       | MIME type + extension     |
| **Download**        | File system              | ArrayBuffer → Figma       |
| **Progress**        | Not available            | Real-time callbacks       |
| **Error Handling**  | Basic try/catch          | Comprehensive error types |

### New Capabilities

| Feature            | Description                 | Implementation          |
| ------------------ | --------------------------- | ----------------------- |
| **Authentication** | Support for private folders | OAuth2 + API keys       |
| **Pagination**     | Handle large folders        | `nextPageToken` support |
| **Metadata**       | Rich file information       | API response fields     |
| **Editor Support** | Figma, FigJam, Slides       | Service specialization  |
| **Configuration**  | Flexible settings           | Config service          |

## 🚨 Breaking Changes

### Environment Requirements

```typescript
// Before: Node.js environment needed
import puppeteer from "puppeteer"; // Node.js only
import fs from "fs"; // Node.js only
import https from "https"; // Node.js only

// After: Browser environment compatible
// All functionality works in Figma plugin sandbox
```

### Function Signatures

```typescript
// Before: Simple callback style
async function scrapeAndDownloadFiles(folderUrl: string) {
  // Implementation
}

// After: Service-based with options
interface ScanResult {
  success: boolean;
  images: DriveFile[];
  error?: string;
  totalFound: number;
}

async scanFolder(
  url: string,
  allowedTypes: string[],
  maxImages: number,
  progressCallback?: ProgressCallback
): Promise<ScanResult>
```

### Error Handling

```typescript
// Before: Generic errors
catch (error) {
  console.log('Download complete.');
}

// After: Structured error types
interface ErrorMessages {
  INVALID_URL: string;
  FOLDER_NOT_FOUND: string;
  API_KEY_MISSING: string;
  RATE_LIMITED: string;
  NETWORK_ERROR: string;
}
```

## 🔄 Migration Steps

### 1. Replace Dependencies

```bash
# Remove old dependencies
npm uninstall puppeteer

# No new dependencies needed (uses native fetch)
```

### 2. Update Code Structure

```typescript
// Before: Direct function calls
await scrapeAndDownloadFiles(folderUrl);

// After: Service instantiation
const pluginService = new PluginService();
await pluginService.initialize();
const result = await pluginService.scanFolder(url, types, maxImages);
```

### 3. Handle New Response Format

```typescript
// Before: Direct file creation
// Files written to disk automatically

// After: Handle scan results
if (result.success) {
  // Process result.images
  const importResult = await pluginService.importToFigma(result.images);
} else {
  // Handle result.error
}
```

### 4. Add Configuration

```typescript
// New: Configure API access
export const API_CONFIG = {
  apiKey: "YOUR_GOOGLE_API_KEY",
  maxRetries: 3,
  maxFileSize: 10 * 1024 * 1024,
  // ...other settings
};
```

## 🎁 Benefits of Migration

### For Developers

- **Better Testing**: Unit tests for individual services
- **Easier Debugging**: Clear separation of concerns
- **Modern TypeScript**: Full type safety and IntelliSense
- **Extensibility**: Easy to add new features

### For Users

- **Faster Performance**: No browser overhead
- **Better Reliability**: API contracts vs DOM scraping
- **Enhanced Features**: Progress tracking, error recovery
- **Cross-Platform**: Works in any environment

### For Maintenance

- **Modular Architecture**: Independent service updates
- **Clear Interfaces**: Well-defined API contracts
- **Configuration Management**: Centralized settings
- **Documentation**: Comprehensive code comments

## 🔮 Future Enhancements

The new architecture enables:

1. **OAuth2 Authentication**: Access private folders
2. **Batch Operations**: Process multiple folders
3. **Advanced Filtering**: By date, size, metadata
4. **Caching Layer**: Reduce API calls
5. **Background Sync**: Automatic updates
6. **Plugin Extensions**: Easy feature additions

## 💡 Best Practices

### Configuration Management

```typescript
// Use environment-specific configs
const config =
  process.env.NODE_ENV === "production" ? productionConfig : developmentConfig;
```

### Error Recovery

```typescript
// Implement retry logic
const retryOperation = async (
  operation: () => Promise<any>,
  maxRetries: number
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
};
```

### Performance Optimization

```typescript
// Batch API calls where possible
const batchedResults = await Promise.allSettled(
  batches.map((batch) => processBatch(batch))
);
```

This migration represents a significant improvement in reliability, performance, and maintainability while preserving all original functionality and adding many new features.
