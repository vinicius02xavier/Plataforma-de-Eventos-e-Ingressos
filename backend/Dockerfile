# Custom Dockerfile for the backend API.
#
# Nixpacks was pruning the compiled `dist/` output from the final image
# even with explicit [phases.build] definitions, causing the container
# to crash on boot with "Cannot find module '/app/dist/server.js'".
# This Dockerfile is a single-stage build that explicitly copies the
# entire working directory (including node_modules, dist, and prisma)
# into the final image, so nothing built during the build step is lost.

FROM node:24-bookworm-slim

# Prisma (with the SQL Server/Postgres engines) needs openssl at runtime,
# plus a few basic build tools for native dependencies (e.g. bcryptjs).
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better layer caching).
COPY package*.json ./
RUN npm install

# Copy the rest of the source and build.
COPY . .
RUN npm run build

# Explicitly ensure the compiled output and runtime dependencies are
# present in the final image. Nothing here is discarded or pruned.
RUN ls -la dist && test -f dist/server.js

EXPOSE 3333

CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm start"]
