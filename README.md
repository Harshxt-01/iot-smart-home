# IoT Smart Home Pro Dashboard Keeellllaaahhhh

Full-stack working website made only with syllabus tools: HTML5, CSS3, vanilla JavaScript, TypeScript, Node.js, Express.js, MongoDB, Mongoose, REST APIs, Git/GitHub-ready structure.

## Features
- Professional responsive smart-home dashboard
- Light/Dark theme switch
- Add, edit, delete smart devices
- Turn devices ON/OFF
- Change thermostat temperature
- Filter by room, type, status, and validation
- Search devices
- Real MongoDB persistence
- REST API backend with Express + TypeScript
- Mongoose schema/model
- Health API and seed sample devices

## Setup

1. Make sure MongoDB is running. Compass connected to `mongodb://localhost:27017` is enough.
2. Open project folder in VS Code.
3. Create `.env` file:

```bash
copy .env.example .env
```

4. Install packages:

```bash
npm install
```

5. Start development server:

```bash
npm run dev
```

6. Open browser:

```text
http://localhost:5000
```

## Production

```bash
npm run build
npm start
```

## API Routes

```text
GET    /api/devices
POST   /api/devices
PUT    /api/devices/:id
DELETE /api/devices/:id
POST   /api/devices/seed
GET    /api/health
```
