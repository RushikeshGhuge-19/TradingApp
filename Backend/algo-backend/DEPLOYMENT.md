# Deploying TradingApp Backend to Vercel

This repository is prepared to deploy the FastAPI backend to Vercel using a Docker container.

Steps to deploy:

1. On GitHub, ensure your backend is pushed to `https://github.com/RushikeshGhuge-19/TradingApp-Backend`.
2. Go to https://vercel.com/new and select **Import Git Repository**.
3. Choose the `TradingApp-Backend` repository under your account/team.
4. Vercel will detect `vercel.json` and use the Dockerfile to build a container.
5. Add any environment variables needed (none are required by default). Then click **Deploy**.

Notes:
- The app will run `uvicorn app.main:app` inside the container on port 8000.
- If you need a custom command or additional system packages, update the `Dockerfile` accordingly.
