# Free Live Deployment Guide (Railway + Netlify + Atlas + Cloudinary)

This guide keeps the existing UI/layout/user-flow unchanged and deploys using only free services.

## 1) MongoDB Atlas (Free)

1. Create free cluster.
2. Create DB user.
3. Network Access -> add `0.0.0.0/0`.
4. Copy connection string as `MONGO_URI`.

## 2) Cloudinary (Free)

1. Create free Cloudinary account.
2. Copy:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

## 3) Backend Deploy on Railway (Free)

Root directory: `server`

Set Railway environment variables:

- `MONGO_URI` = your Atlas connection string
- `JWT_SECRET` = strong random string
- `EMAIL_USER` = your sender email
- `EMAIL_PASS` = app password for sender email
- `CLIENT_URL` = your Netlify URL (after frontend deploy)
- `CLOUDINARY_CLOUD_NAME` = from Cloudinary dashboard
- `CLOUDINARY_API_KEY` = from Cloudinary dashboard
- `CLOUDINARY_API_SECRET` = from Cloudinary dashboard
- `FACE_MATCH_THRESHOLD` = `0.45`

Notes:
- App supports `MONGO_URL` or `MONGO_URI`.
- App supports `EMAIL/EMAILPASSWORD` or `EMAIL_USER/EMAIL_PASS`.
- New endpoint added: `POST /api/auth/verify-face` for strict server-side liveness + face verification.

## 4) Frontend Deploy on Netlify (Free)

Root directory: `Client`

Build settings:
- Build command: `npm run build`
- Publish directory: `build`

Set Netlify environment variables:
- `REACT_APP_SERVER_URL` = `https://<your-railway-domain>/api/auth/`
- `REACT_APP_CLIENT_URL` = `https://<your-netlify-domain>/`

This avoids hardcoded localhost API calls.

## 5) Functional Checks (Post Deploy)

Verify:
- Registration saves face descriptor and uploads profile/id docs.
- OTP flow works.
- Login generates fresh passcode.
- Voting opens face dialog and enforces:
  - blink (open -> closed -> open)
  - movement across multiple frames
  - minimum frame count (>=10, implemented as 12)
  - strict backend threshold (default 0.45)
- Real face passes.
- Printed/static face fails.
- Different person fails.

## 6) Local Backup Tunnel

Use this if Railway is temporarily unavailable:

`npx localtunnel --port 5000`

