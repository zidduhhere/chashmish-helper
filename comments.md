# Figma Plugin Comments

## Main Plugin Description

- This file holds the main code for plugins. Code in this file has access to the _figma document_ via the figma global object.
- You can access browser APIs in the <script> tag inside "ui.html" which has a full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

## Figma Mode

- Runs this code if the plugin is run in Figma
- This plugin will open a window to prompt the user to enter a number, and it will then create that many rectangles on the screen.
- This shows the HTML page in "ui.html".
- Calls to "parent.postMessage" from within the HTML page will trigger this callback. The callback will be passed the "pluginMessage" property of the posted message.
- One way of distinguishing between different types of messages sent from your HTML page is to use an object with a "type" property like this.
- This plugin creates rectangles on the screen.
- Make sure to close the plugin when you're done. Otherwise the plugin will keep running, which shows the cancel button at the bottom of the screen.

## FigJam Mode

- Runs this code if the plugin is run in FigJam
- This plugin will open a window to prompt the user to enter a number, and it will then create that many shapes and connectors on the screen.
- This shows the HTML page in "ui.html".
- Calls to "parent.postMessage" from within the HTML page will trigger this callback. The callback will be passed the "pluginMessage" property of the posted message.
- One way of distinguishing between different types of messages sent from your HTML page is to use an object with a "type" property like this.
- This plugin creates shapes and connectors on the screen.
- You can set shapeType to one of: 'SQUARE' | 'ELLIPSE' | 'ROUNDED_RECTANGLE' | 'DIAMOND' | 'TRIANGLE_UP' | 'TRIANGLE_DOWN' | 'PARALLELOGRAM_RIGHT' | 'PARALLELOGRAM_LEFT'
- Make sure to close the plugin when you're done. Otherwise the plugin will keep running, which shows the cancel button at the bottom of the screen.

## Slides Mode

- Runs this code if the plugin is run in Slides
- This plugin will open a window to prompt the user to enter a number, and it will then create that many slides on the screen.
- This shows the HTML page in "ui.html".
- Calls to "parent.postMessage" from within the HTML page will trigger this callback. The callback will be passed the "pluginMessage" property of the posted message.
- One way of distinguishing between different types of messages sent from your HTML page is to use an object with a "type" property like this.
- This plugin creates slides and puts the user in grid view.
- Make sure to close the plugin when you're done. Otherwise the plugin will keep running, which shows the cancel button at the bottom of the screen.
