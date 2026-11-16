# Jhandi Munda (ASH GAMING)

A phone-friendly Jhandi Munda card game for fun. Opens with an ASH GAMING splash,
asks new players for a name, and has a host page at /admin.

## Run locally
    npm install
    npm start
Open http://localhost:3000 (game) and http://localhost:3000/admin (host controls).

## Admin key
Default key is set in server.js. To use a different one, add an ADMIN_KEY environment
variable on Render (it overrides the default).

## Deploy on Render (free)
1. Push this folder to GitHub (a private repo keeps the default key hidden).
2. Render: New > Web Service > connect the repo.
3. Build Command: `npm install`   Start Command: `npm start`   Plan: Free.
