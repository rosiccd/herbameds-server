<<<<<<< HEAD
# Koristi Node.js
FROM node:20-slim

# Instaliraj Chromium dependencies
RUN apt-get update && apt-get install -y \
    gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
    libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
    libgtk-3-0 libnspr4 libpango-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
    libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 \
    lsb-release xdg-utils wget \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Kopiraj package.json i package-lock.json
COPY package*.json ./

# Instaliraj dependencies
RUN npm install

# Kopiraj ceo kod
COPY . .

# Expose port (Fly.io koristi PORT varijablu)
ENV PORT=5000
EXPOSE 5000

# Start servera
CMD ["node", "server.js"]
=======
FROM node:18-slim

# Instalacija Chromiuma i svih zavisnosti
RUN apt-get update && apt-get install -y \
  chromium \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libgtk-3-0 \
  libnss3 \
  libxshmfence1 \
  wget \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Kažemo Puppeteer-u da NE skida svoj Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Prvo package.json zbog keša
COPY package*.json ./
RUN npm install --omit=dev

# Ostatak koda
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
>>>>>>> 667a263d8997cba6c5be9add924d7be0934991d7
