A personal project, not for commercial purposes.

DM4A Project (D-Download and M4A-.m4a)

The project involves downloading the .m4a file and streaming the lyrics.

1. Local Development Setup

Prerequisites

Node.js (LTS version recommended)

npm or yarn

Git

Android Studio (for Android Emulator) or an Android device.

Backend Server Setup

Navigate to the server directory:

cd server


Install dependencies:

npm install


Start the server:

npm run dev
# or
npm start


The server will run on http://localhost:3000.

Mobile App Setup

Navigate to the app directory:

cd appp


Install dependencies:

npm install


Important: Configure the API URL.

Open src/services/api.ts.

Change API_URL to your computer's local IP address (e.g., http://192.168.1.X:3000).

Note: Do not use localhost if testing on a physical device.

Run the application:

npx expo start


Scan the QR code with Expo Go app (Android/iOS).

Or press a to run on Android Emulator.

2. Server Deployment (VPS/Cloud)

VPS Requirements

OS: Ubuntu 20.04/22.04 (Recommended)

Node.js & npm

PM2 (Process Manager)

FFmpeg (Required for audio processing)

Setup Instructions

SSH into your VPS.

Install dependencies:

sudo apt update
sudo apt install nodejs npm ffmpeg git -y
sudo npm install -g pm2 typescript ts-node


Clone the repository:

git clone <your-repo-url>
cd Dm4a/server


Install & Build:

npm install
npm run build


Start the Server with PM2:

pm2 start dist/index.js --name "dm4a-server"
pm2 save
pm2 startup


Update Mobile App:

Update src/services/api.ts in your local appp folder.

Set API_URL to your VPS IP address or domain (e.g., http://YOUR_VPS_IP:3000).

Rebuild the app if necessary.
