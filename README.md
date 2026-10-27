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
