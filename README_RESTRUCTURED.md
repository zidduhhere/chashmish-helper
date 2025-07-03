# Chasmish Scrapper - Restructured Google Drive API Integration

A professional Figma plugin that imports images from Google Drive folders using proper API integration. This version has been completely restructured for better maintainability, reliability, and scalability.

## 🏗️ New Architecture

### Project Structure

```
chasmish-scrapper/
├── src/
│   ├── drive-api.ts      # Google Drive API service
│   ├── plugin-service.ts # Main business logic
│   └── config.ts         # Configuration and constants
├── code.ts               # Plugin entry point
├── ui.html              # User interface
├── manifest.json        # Plugin manifest
└── package.json         # Dependencies
```

### Service Layer Architecture

#### 1. **GoogleDriveService** (`src/drive-api.ts`)

- **Purpose**: Handles all Google Drive API interactions
- **Features**:
  - Folder ID extraction from various URL formats
  - File listing with pagination support
  - Image filtering by MIME type and extension
  - File downloading with error handling
  - Public folder access optimization

#### 2. **PluginService** (`src/plugin-service.ts`)

- **Purpose**: Coordinates between UI, Drive API, and Figma API
- **Features**:
  - Unified scanning interface for all editor types
  - Editor-specific import methods (Figma, FigJam, Slides)
  - Progress tracking and error handling
  - Configurable import options

#### 3. **Configuration** (`src/config.ts`)

- **Purpose**: Centralized configuration management
- **Features**:
  - API endpoints and settings
  - Error messages and constants
  - File type mappings
  - Default import settings

## 🚀 Key Improvements

### Compared to Original Puppeteer Code

| Feature               | Original              | New Implementation             |
| --------------------- | --------------------- | ------------------------------ |
| **Web Scraping**      | Puppeteer DOM parsing | Direct Google Drive API        |
| **Authentication**    | None                  | API key + OAuth2 support       |
| **Error Handling**    | Basic try/catch       | Comprehensive error types      |
| **File Detection**    | Regex extraction      | API metadata + MIME types      |
| **Progress Tracking** | None                  | Real-time progress callbacks   |
| **Code Organization** | Single file           | Modular service architecture   |
| **Testing**           | Not testable          | Service-based, easily testable |
| **Scalability**       | Limited               | Pagination, batching support   |

### New Features

1. **🔐 Proper Authentication Support**

   - API key for public folders
   - OAuth2 for private folders (future enhancement)

2. **📊 Enhanced Progress Tracking**

   - Real-time progress updates
   - Detailed status messages
   - Error state management

3. **🎯 Editor-Specific Optimizations**

   - **Figma**: Rectangles and components with layout management
   - **FigJam**: Sticky notes with image previews
   - **Slides**: Centered images on individual slides

4. **⚙️ Configurable Import Options**

   - Image size and spacing
   - Images per row
   - Aspect ratio preservation
   - Component creation

5. **🛡️ Robust Error Handling**
   - Network error recovery
   - API rate limiting handling
   - File size validation
   - Format validation

## 🔧 Setup and Configuration

### 1. Google Drive API Setup

1. **Create Google Cloud Project**:

   ```bash
   # Go to: https://console.cloud.google.com/
   # Create new project or select existing
   ```

2. **Enable Google Drive API**:

   ```bash
   # In Cloud Console: APIs & Services > Library
   # Search for "Google Drive API" and enable it
   ```

3. **Create API Credentials**:

   ```bash
   # APIs & Services > Credentials
   # Create API Key for public folder access
   # Or OAuth2 Client ID for private folders
   ```

4. **Configure the Plugin**:
   ```typescript
   // In src/config.ts
   export const API_CONFIG: ApiConfig = {
     apiKey: "YOUR_GOOGLE_API_KEY_HERE",
     clientId: "YOUR_OAUTH2_CLIENT_ID", // Optional
     // ...rest of config
   };
   ```

### 2. Development Setup

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Watch for changes during development
npm run watch
```

### 3. Figma Plugin Installation

1. Open Figma Desktop App
2. Go to Plugins > Development > Import plugin from manifest
3. Select the `manifest.json` file
4. The plugin will appear in your plugins list

## 📖 Usage Guide

### Basic Usage

1. **Open the Plugin**:

   - In Figma: Plugins > Chasmish Scrapper

2. **Enter Google Drive Folder URL**:

   ```
   https://drive.google.com/drive/folders/1ABC123XYZ
   ```

3. **Configure Settings**:

   - Select image types (JPG, PNG, SVG, WebP)
   - Set maximum images to import
   - Choose create components option (Figma only)

4. **Scan and Import**:
   - Click "Scan Drive Folder"
   - Review found images
   - Select desired images
   - Click "Import Selected"

### Advanced Configuration

```typescript
// Custom import options
const importOptions: ImportOptions = {
  createComponents: true,
  imageSize: 300, // pixels
  spacing: 25, // pixels between images
  imagesPerRow: 4, // layout configuration
  preserveAspectRatio: true, // maintain original proportions
};
```

## 🔐 Security and Privacy

### Data Handling

- **No data storage**: All processing happens locally
- **Secure API calls**: HTTPS only for all requests
- **Limited permissions**: Read-only access to specified folders
- **No tracking**: No analytics or usage tracking

### API Key Security

- Store API keys securely (never in version control)
- Use environment variables in production
- Implement key rotation policies
- Monitor API usage in Google Cloud Console

## 🚨 Troubleshooting

### Common Issues

1. **"Folder not accessible" Error**:

   - Ensure folder is publicly shared
   - Check folder URL format
   - Verify API key permissions

2. **"API rate limited" Error**:

   - Wait a few minutes before retrying
   - Consider upgrading Google Cloud quota
   - Implement request batching

3. **Images not downloading**:
   - Check internet connection
   - Verify file permissions
   - Ensure files are actually images

### Debug Mode

Enable debug logging:

```typescript
// In src/config.ts
export const DEBUG_MODE = true;
```

## 🛠️ Development

### Running Tests

```bash
# Unit tests for services
npm test

# Integration tests
npm run test:integration
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Formatting
npm run format
```

### Building for Production

```bash
# Production build
npm run build:prod

# Generate documentation
npm run docs
```

## 📈 Performance Considerations

### Optimization Features

- **Lazy loading**: Images loaded on demand
- **Pagination**: Handle large folders efficiently
- **Caching**: Reduce redundant API calls
- **Batch processing**: Import multiple images efficiently
- **Memory management**: Clean up resources properly

### Recommended Limits

- **Max images per import**: 50 (configurable)
- **Max file size**: 10MB per image
- **Concurrent downloads**: 5 simultaneous
- **API calls per minute**: 100 (Google Drive limit)

## 🤝 Contributing

### Development Guidelines

1. Follow TypeScript strict mode
2. Add JSDoc comments for all public methods
3. Include unit tests for new features
4. Update documentation for API changes

### Code Style

- Use meaningful variable names
- Prefer composition over inheritance
- Handle errors gracefully
- Log important events

## 📝 API Reference

### PluginService Methods

```typescript
// Scan folder for images
await pluginService.scanFolder(url, types, maxImages, progressCallback);

// Import to Figma
await pluginService.importToFigma(images, options, progressCallback);

// Import to FigJam
await pluginService.importToFigJam(images, progressCallback);

// Import to Slides
await pluginService.importToSlides(images, progressCallback);
```

### GoogleDriveService Methods

```typescript
// Extract folder ID
const folderId = driveService.extractFolderId(url);

// Scan folder
const result = await driveService.scanFolder(folderId);

// Filter images
const images = driveService.filterImageFiles(files, types);

// Download file
const data = await driveService.downloadFile(file);
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For support and questions:

- Check the troubleshooting guide above
- Review the API documentation
- Open an issue on the repository
- Contact the development team

---

**Note**: This restructured version provides a much more maintainable and scalable foundation compared to the original Puppeteer implementation, while maintaining all the core functionality and adding significant improvements.
