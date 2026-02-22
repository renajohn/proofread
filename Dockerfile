FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install tsx
COPY --from=build /app/dist ./dist
COPY src ./src
COPY tsconfig.json tsconfig.node.json ./
EXPOSE 3001
CMD ["npx", "tsx", "src/server/index.ts"]
