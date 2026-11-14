# Jhandi Munda (play-coins party game)

A phone-friendly Jhandi Munda game for fun, using play coins only.

## Run locally
    npm install
    ADMIN_KEY=mysecret npm start
Open http://localhost:3000 (game) and http://localhost:3000/admin (host controls).

## Deploy on Render (free)
1. Push this folder to GitHub.
2. Render: New > Web Service > connect the repo.
3. Build Command: `npm install`   Start Command: `npm start`   Plan: Free.
4. Environment: add `ADMIN_KEY` with your own password.
