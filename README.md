# Growatt API Dashboard

A simple web application that retrieves data from the Growatt API and displays it in a nice dashboard.

## Features

- View plant list with current power and total energy
- View device list with device details
- Auto-refresh with rate limiting (respects API limits)
- Clean, responsive dashboard design

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 14.x or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`
- **npm** (version 6.x or higher)
  - Comes bundled with Node.js
  - Verify installation: `npm --version`
- **Growatt API Token**
  - Required to access the Growatt API
  - Obtain from your Growatt account

## Installation

1. Clone the repository:
```bash
git clone https://github.com/GeraldPape/growatt-app
cd growatt-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure your API token:
   - Copy `.env.example` to `.env`
   - Add your Growatt API token to `.env`

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## API Rate Limits

- Plant List: Once every 5 minutes, max 10 times per day
- Device List: Once every 5 minutes

The application automatically caches data and respects these limits.
