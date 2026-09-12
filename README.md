# TripSage

TripSage is a mobile-first AI travel planning assistant. The Expo app talks only to the Express API; provider secrets stay on the server.

## Setup

1. Install Node 18+ and MongoDB.
2. Copy `.env.example` to `server/.env` and set `MONGODB_URI`, `JWT_SECRET`, and any AI/weather keys.
3. Run `npm install` from the root.
4. Start the API with `npm run server`.
5. In another terminal, run `npm run mobile` and open it in Expo Go.

For a physical device, set `EXPO_PUBLIC_API_URL` in `mobile/.env` to the LAN URL of the API (for example `http://192.168.1.10:4000/api`).

## Architecture

- `server/src/services/aiService.js` normalizes OpenAI, Anthropic, and Gemini responses and falls back to a deterministic plan when keys or providers fail.
- `server/src/services/weatherService.js` isolates OpenWeatherMap and degrades gracefully.
- `mobile/src/features` contains auth, trip workflows, RTK Query reads, and offline state.
- AsyncStorage stores the auth session, cached trips, and photo URIs. AI/weather calls never originate in the mobile app.

## API

Auth: `POST /api/auth/register`, `POST /api/auth/login`
Trips: `POST /api/trips`, `GET /api/trips`, `GET /api/trips/:id`, `DELETE /api/trips/:id`
Packing: `PATCH /api/trips/:id/packing/:itemId`, `POST /api/trips/:id/packing`
Itinerary: `POST /api/trips/:id/itinerary/regenerate-day`
