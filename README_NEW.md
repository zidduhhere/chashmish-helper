# Chasmish Scrapper - Google Drive Image Importer

A Figma plugin that scrapes and imports images from Google Drive folders directly into your Figma, FigJam, or Slides projects.

## Features

- 🔍 **Scan Google Drive folders** for images
- 📥 **Import multiple images** at once
- 🎨 **Support for multiple formats**: JPG, PNG, SVG, WebP
- 🧩 **Create Figma Components** option
- 📋 **Works across all Figma products**: Figma, FigJam, and Slides
- 🖼️ **Preview thumbnails** before importing

## How It Works

### Original Code Analysis

The provided Puppeteer code performs these operations:

1. **Web Scraping with Puppeteer**: Uses headless Chrome to navigate Google Drive
2. **DOM Parsing**: Finds file list items and extracts names/links
3. **URL Transformation**: Converts Drive view URLs to download URLs
4. **File Download**: Downloads files using Node.js HTTPS module

### Figma Plugin Implementation

Since Figma plugins run in a sandboxed environment without Node.js/Puppeteer access, this implementation uses:

1. **Google Drive API**: Direct API calls to fetch folder contents
2. **Fetch API**: Browser-native downloading of images
3. **Figma Plugin API**: Creates images, rectangles, and components

## Code Structure

### Core Functions

#### `extractFolderId(url: string)`

- Extracts Google Drive folder ID from various URL formats
- Supports multiple Drive URL patterns

#### `isImageFile(file: DriveFile, allowedTypes: string[])`

- Filters files by MIME type and file extension
- Supports JPG, PNG, SVG, WebP formats

#### `scanGoogleDriveFolder(data: ScanMessage['data'])`

- Main scanning function that:
  - Calls Google Drive API
  - Filters for image files
  - Returns structured image data

#### `importImages(images: DriveFile[], createComponents: boolean)`

- Downloads and imports images into Figma
- Creates rectangles with image fills
- Optionally creates components
- Arranges images in a grid layout

### Editor-Specific Functions

#### `importImagesAsStickyNotes(images: DriveFile[])`

- FigJam-specific import
- Creates sticky notes with image previews

#### `importImagesAsSlides(images: DriveFile[])`

- Slides-specific import
- Creates new slides with centered images

## Usage

1. **Get a Google Drive folder link**:

   - Make sure the folder is publicly accessible
   - Copy the sharing link

2. **Enter the link** in the plugin interface

3. **Select image types** you want to import

4. **Set maximum images** to import (1-50)

5. **Choose options**:

   - Create as Figma Components (Figma only)

6. **Click "Scan Drive Folder"**

7. **Review found images** and select which to import

8. **Click "Import Selected"**

## Technical Implementation Details

### Google Drive API Integration

```typescript
const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,thumbnailLink,webContentLink)`;
```

### Image Processing

```typescript
const imageData = await response.arrayBuffer();
const uint8Array = new Uint8Array(imageData);
const imageHash = figma.createImage(uint8Array);
```

### Error Handling

- API access validation
- Network error handling
- File format validation
- Progress reporting

## Limitations

1. **Public folders only**: The Google Drive folder must be publicly accessible
2. **API rate limits**: Google Drive API has usage quotas
3. **File size limits**: Large images may take time to process
4. **Network dependency**: Requires internet connection

## Development

### Build the plugin:

```bash
npm run build
```

### Watch for changes:

```bash
npm run watch
```

## Comparison with Original Code

| Feature            | Original Puppeteer Code     | Figma Plugin Implementation     |
| ------------------ | --------------------------- | ------------------------------- |
| Browser Automation | ✅ Puppeteer                | ❌ Not available in sandbox     |
| File System Access | ✅ Node.js fs module        | ❌ Browser sandbox restrictions |
| Network Requests   | ✅ HTTPS module             | ✅ Fetch API                    |
| DOM Scraping       | ✅ Direct page manipulation | ✅ API-based data fetching      |
| File Download      | ✅ Stream to filesystem     | ✅ ArrayBuffer processing       |

## Security & Privacy

- No authentication tokens stored
- Only processes publicly accessible folders
- Images are processed locally in the plugin
- No data sent to external servers

## Original Installation Guide

Below are the steps to get your plugin running. You can also find instructions at:

https://www.figma.com/plugin-docs/plugin-quickstart-guide/

This plugin template uses Typescript and NPM, two standard tools in creating JavaScript applications.

First, download Node.js which comes with NPM. This will allow you to install TypeScript and other
libraries. You can find the download link here:

https://nodejs.org/en/download/
