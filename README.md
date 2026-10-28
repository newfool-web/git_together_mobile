# GitTogether Mobile

GitTogether Mobile is the React Native client for the GitTogether developer
networking application. It is built with Expo and provides authentication,
developer discovery, connection requests, profiles, and real-time chat.

The backend is maintained in a separate repository. This repository contains
only the mobile application. The backend must be running separately for the
mobile application to load data and use authenticated features.

## Technology

- Expo SDK 58
- React Native
- React Navigation
- Redux Toolkit
- Axios
- Socket.IO Client
- Expo SecureStore

## Prerequisites

- Node.js LTS
- npm
- The GitTogether backend repository
- Expo Go, Android Emulator, or iOS Simulator

## Install

Install the mobile dependencies from this repository's root directory:

```powershell
npm install
```

The `node_modules` directory is created locally by `npm install` and is not
stored in the repository.

## Configure environment variables

Create a `.env` file in the project root:

```env
API_URL=http://<backend-host>:3000/api
SOCKET_URL=http://<backend-host>:3000
```

- `API_URL` is the backend HTTP API URL and must end with `/api`.
- `SOCKET_URL` is the backend Socket.IO URL and must not include `/api`.

Use the backend host that matches where the app runs:

### Physical device on the same network

```env
API_URL=http://<computer-lan-ip>:3000/api
SOCKET_URL=http://<computer-lan-ip>:3000
```

### Android Emulator

```env
API_URL=http://10.0.2.2:3000/api
SOCKET_URL=http://10.0.2.2:3000
```

### iOS Simulator

```env
API_URL=http://localhost:3000/api
SOCKET_URL=http://localhost:3000
```

Do not commit `.env` or put private credentials in it.

For EAS cloud builds, `.env` is not uploaded because it is ignored by Git.
The mobile client therefore has the deployed backend URL as its committed
production fallback. Keep `.env` for local development overrides.

### Build an Android APK

The repository includes an EAS preview profile that produces an installable
APK. The current `.env` uses the deployed backend:

```env
API_URL=https://git-together-theta.vercel.app/api
SOCKET_URL=https://git-together-theta.vercel.app
```

Install and authenticate with EAS, then run the build from the repository root:

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build:configure
npx.cmd eas-cli@latest build --platform android --profile preview
```

If EAS asks to create or link a project, choose the current
`gittogether-mobile` project. When the build completes, download the APK from
the URL printed by EAS and install it on an Android device. The preview
profile is for direct APK installation; use the `production` profile when
publishing an Android App Bundle to Google Play.

The deployed backend must expose the same `/api` routes used by the mobile
client. Socket.IO chat requires a deployment that supports long-lived
WebSocket connections; if the Vercel deployment does not support them, the
HTTP features can still work but real-time chat will require moving the
Socket.IO server to a WebSocket-capable host.

## Run

First, install and start the backend from its separate repository using that
repository's instructions. It should be available on port `3000`, or the port
configured in `.env`.

Then, from the mobile repository, start Expo:

```powershell
npx.cmd expo start
```

Use the Expo interface to open the app in Expo Go or an emulator.

For a physical device connected over LAN:

```powershell
npx.cmd expo start --lan
```

For an Android Emulator, press `a` in the Expo terminal.

For an iOS Simulator, press `i` in the Expo terminal on macOS.

## Available scripts

```powershell
npm run start
npm run android
npm run ios
npm run lint
```

## Project structure

```text
GitTogether-mobile/
├── App.js
├── app.json
├── babel.config.js
├── package.json
└── src/
    ├── navigation/
    ├── screens/
    └── utils/
```
