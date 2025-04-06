# Glucose Widget

A desktop application that displays a real-time graph of glucose levels using LibreView data.

## Features

- Real-time glucose level visualization
- Automatic updates every 60 seconds
- Visual indicators for high and low levels
- Customizable target range
- Clean and minimalistic interface
- Data persistence between sessions
- Dark mode by default

## Technologies Used

- Electron for the desktop application
- Next.js for the frontend
- Chart.js for graph visualization
- LibreView API for glucose data

## Requirements

- Node.js 18 or higher
- npm 9 or higher
- LibreView account with API access

## Installation

1. Clone the repository:
```bash
git clone [REPOSITORY_URL]
cd glucose-widget
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env.local` file in the project root with:
```
NEXT_PUBLIC_API_URL=https://api.libreview.io
```

## Development

To run the application in development mode:
```bash
npm run electron:dev
```

This will start:
- Next.js development server
- Electron application
- Development tools

## Production

To build the application:
```bash
npm run build
npm run electron:build
```

## Project Structure

```
glucose-widget/
├── electron/           # Electron configuration
├── src/               # Next.js source code
│   ├── app/          # Components and pages
│   ├── api/          # API routes
│   └── styles/       # Global styles
├── public/           # Static files
└── package.json      # Dependencies and scripts
```

## Security

- The application uses localStorage to store authentication data
- Content Security Policy (CSP) is implemented to protect against XSS attacks
- Credentials are handled securely and are not stored in plain text

## License

MIT
