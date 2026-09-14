# The hosted door (R48): PlotCoder's MCP server over HTTP. Build and run
# anywhere; put HTTPS in front, since the writer's sign-in travels in a header.
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY scripts ./scripts
COPY src/board ./src/board
ENV PORT=8787
EXPOSE 8787
CMD ["node", "scripts/plotcoder-http.mjs"]
