# Growatt API Dashboard

A simple web application that retrieves data from the Growatt API and displays it in a nice dashboard.

## Features

- View plant list with current power and total energy
- View device list with device details
- Auto-refresh with rate limiting (respects API limits)
- Clean, responsive dashboard design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your API token:
   - Copy `.env.example` to `.env`
   - Add your Growatt API token to `.env`

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## API Rate Limits

- Plant List: Once every 5 minutes, max 10 times per day
- Device List: Once every 5 minutes

The application automatically caches data and respects these limits.
