FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

ENV PORT 3000
ENV NEXT_PUBLIC_API_URL=http://localhost:3001

# Start development server (for Docker, use production build in real deployment)
CMD ["npm", "run", "dev"]

