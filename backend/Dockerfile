FROM node:18-slim

# Install BLAST (ncbi-blast+)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ncbi-blast+ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
