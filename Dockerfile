# Stage 1: Build the frontend
FROM node:20-alpine AS build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the backend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev
COPY backend/ ./backend/
COPY --from=build /app/frontend/dist ./frontend/dist

# Expose port and start
EXPOSE 8080
ENV PORT=8080
WORKDIR /app/backend
CMD ["npm", "start"]
