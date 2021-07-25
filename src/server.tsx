import {
  Application,
  Colors,
  gzip,
  ReactDOMServer,
  Router,
} from "../depBack.ts";
import { React } from "../depFront.ts";

import { App } from "./components/App.tsx";

/*
 * Hydration script generation that will be served as /main.js
 */
const emitStart = Date.now();
const { diagnostics, files } = await Deno.emit(
  new URL("main.tsx", import.meta.url),
  {
    bundle: "module",
    check: false, // 2s gain
    compilerOptions: {
      lib: ["dom", "esnext"],
      sourceMap: false,
    },
  },
);
console.log(
  Colors.magenta(
    `Emitted Hydration script files (${
      Colors.red(`${Date.now() - emitStart} ms`)
    }):`,
  ),
  Object.keys(files),
  diagnostics,
  Math.round(files[Object.keys(files)[0]].length / 1024),
);

/*
 * Basic Router
 */
const router = new Router();
router
  .get("/", (ctx) => {
    const app = ReactDOMServer.renderToString(<App />);
    console.info(Colors.magenta(" SSR:"), Colors.cyan(app));

    ctx.response.type = "text/html";
    ctx.response.body = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <script type="module" src="/main.js"></script>
        </head>
        <body>
            <div id="app">${app}</div>
        </body>
        </html>`;
  })
  .get("/main.js", (ctx) => {
    ctx.response.type = "application/javascript";
    ctx.response.body = files["deno:///bundle.js"];
  });

/*
 * Server
 */
const app = new Application();

// Basic error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error(Colors.red(ctx.state.requestId), "ERROR", err);
    ctx.response.body = "";
    ctx.response.status = 500;
  }
});

// Log
app.use(async (ctx, next) => {
  const start = Date.now();
  ctx.state.requestId = crypto.randomUUID();
  const { method, url } = ctx.request;
  console.log(ctx.state.requestId, `${method} ${url}`);

  await next();

  console.log(
    ctx.state.requestId,
    `${method} ${url} ${ctx.response.status} (${Date.now() - start} ms)`,
  );
});

// Compress
app.use(async (ctx, next) => {
  await next();
  if (
    ctx.response.type &&
    ["application/javascript", "text/html"].includes(ctx.response.type) &&
    typeof ctx.response.body === "string"
  ) {
    console.log(Colors.magenta(` compressing response`));
    ctx.response.body = gzip(
      new TextEncoder().encode(ctx.response.body),
      undefined,
    );
    ctx.response.headers.append("Content-Encoding", "gzip");
  }
});

// Initial HTTP server log
app.addEventListener("listen", ({ port }) => {
  console.log(`Listening on: ${Colors.yellow(`http://localhost:${port}`)}`);
});

// Configure router
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
await app.listen({ port: 8097 });
