# IoT Smart Home Pro Dashboard

A production-ready full-stack IoT Smart Home Dashboard built with HTML5, CSS3, vanilla JavaScript, TypeScript, Node.js, Express.js, MongoDB, Mongoose and REST APIs.

## What is fixed in this version

- Removed real `.env`, `.git`, `node_modules` and generated `dist` from the clean project package.
- Added secure signed Bearer-token authentication using `JWT_SECRET`.
- Removed insecure `x-user-id` based access from device APIs.
- Added salted PBKDF2 password hashing using Node.js `crypto`.
- Protected all device routes with auth middleware.
- Added security response headers and safer Express JSON limits.
- Added deployment-friendly environment setup.

## Features

- Register and login users
- Forgot password and reset password flow with hashed, expiring reset tokens
- Protected user-specific device dashboard
- Add, update, delete and seed smart devices
- Turn devices ON/OFF
- Change thermostat temperature
- Filter/search devices by room, type, status and validation
- Light/dark theme switch
- Editable user profile from dashboard top bar
- Update name, email, phone, home location and password
- MongoDB persistence
- Express REST API with TypeScript

## Local setup

1. Install Node.js 20.x.
2. Install MongoDB locally or create a MongoDB Atlas database.
3. Create `.env` from `.env.example`:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

4. Update `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/iot-pro-dashboard
JWT_SECRET=replace-with-a-long-random-secret-minimum-16-characters
CORS_ORIGIN=
APP_URL=http://localhost:5000
```

5. Install packages:

```bash
npm install
```

6. Run development server:

```bash
npm run dev
```

7. Open:

```text
http://localhost:5000
```

## Production / deployment

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Environment variables required on Render/Railway/etc.:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
NODE_ENV=production
```

## API Routes

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/me
GET    /api/health
GET    /api/devices
POST   /api/devices
PUT    /api/devices/:id
DELETE /api/devices/:id
POST   /api/devices/seed
```

Device routes require:

```text
Authorization: Bearer <token>
```

## Important security note

Do not commit `.env`. If your previous MongoDB password was shared anywhere, rotate/change it in MongoDB Atlas before deployment.


## Landing/About Page

The root URL `/` now opens a modern HomeIQ about/landing page with project overview, features, workflow, supported devices, and a **Get Started** button.

- Get Started/Login redirects to `/auth.html`
- Successful login/register redirects to `/dashboard.html`
- Dashboard is available at `/dashboard.html`
