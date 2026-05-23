FROM node:18-slim

# Install BLAST (ncbi-blast+)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ncbi-blast+ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm ci --omit=dev --no-audit --no-fund

COPY . .

ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
