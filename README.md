# mcp-k8s-lens

A Model Context Protocol server that provides Lens Desktop automation capabilities.

## Features

- 📸 Screenshot capture of entire Lens Desktop pages or specific elements
- 📊 Console log monitoring

## Components

### Tools

#### `lens_desktop_screenshot`

Capture screenshots of the entire Lens Desktop page or specific elements
```javascript
{
  "name": "screenshot-name",     // required
  "selector": "#element-id",     // optional
  "fullPage": true               // optional, default: false
}
```

#### `lens_desktop_console_logs`

Capture the logs from Lens Desktop renderer process


## Acknowledge

Mostly inspired by <https://github.com/executeautomation/mcp-playwright>