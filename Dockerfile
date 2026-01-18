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
