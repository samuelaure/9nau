FROM node:20-alpine AS builder

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

WORKDIR /app
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY turbo.json ./

# Copy packages and apps (we need the entire workspace structure for pnpm to resolve local dependencies)
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/web ./apps/web
# Skip mobile safely just in case it breaks missing SDKs
# We don't copy apps/mobile

RUN pnpm install --frozen-lockfile

# Generate Prisma Client specifically in the API package
RUN cd apps/api && npx prisma generate

# Build the API (this will use turbo)
RUN pnpm --filter @9nau/api build
RUN pnpm --filter @9nau/web build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

# Copy the entire built structure (monorepos need the hoisting from root)
COPY --from=builder /app ./

EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "apps/api/dist/main"]
