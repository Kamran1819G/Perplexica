FROM node:20.18.0-slim AS builder

WORKDIR /home/perplexify

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY tsconfig.json next.config.mjs next-env.d.ts postcss.config.js drizzle.config.ts tailwind.config.ts ./
COPY src ./src
COPY public ./public

RUN mkdir -p /home/perplexify/data
RUN yarn build

RUN yarn add --dev @vercel/ncc
RUN yarn ncc build ./src/lib/db/migrate.ts -o migrator

FROM node:20.18.0-slim

WORKDIR /home/perplexify

COPY --from=builder /home/perplexify/public ./public
COPY --from=builder /home/perplexify/.next/static ./public/_next/static

COPY --from=builder /home/perplexify/.next/standalone ./
COPY --from=builder /home/perplexify/data ./data
COPY drizzle ./drizzle
COPY --from=builder /home/perplexify/migrator/build ./build
COPY --from=builder /home/perplexify/migrator/index.js ./migrate.js

RUN mkdir /home/perplexify/uploads

COPY config.toml ./config.toml
COPY entrypoint.sh ./entrypoint.sh
RUN dos2unix ./entrypoint.sh || true
RUN chmod +x ./entrypoint.sh

CMD ["sh", "-c", "node migrate.js && exec node server.js"]