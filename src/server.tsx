import { Application, Colors, ReactDOMServer, Router } from "./depBack.ts";
import { React } from "./depFront.ts";

import { App } from "./components/App.tsx";

/*
 * Hydration script generation
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
);

/*
 * Basic Router
 */
const router = new Router();
router
  .get("/", (context) => {
    const app = ReactDOMServer.renderToString(<App />);
    console.info(Colors.magenta("Quick SSR:"), Colors.cyan(app));

    context.response.type = "text/html";
    context.response.body = `
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
  .get("/main.js", (context) => {
    context.response.type = "application/javascript";
    context.response.body = files["deno:///bundle.js"];
  });

/*
 * Server
 */
const app = new Application();

// Basic error handler
app.use(async (_, next) => {
  try {
    await next();
  } catch (err) {
    console.error(err);
    throw err;
  }
});

// Log
app.use(async (ctx, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  const { method, url } = ctx.request;

  console.log(`${requestId} - ${method} ${url}`);

  await next();

  console.log(
    `${requestId} - ${method} ${url} ${ctx.response.status} (${Date.now() -
      start} ms)`,
  );
});

// Initial HTTP server log
app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${hostname}:${port}`,
  );
});

// Configure router
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
await app.listen({ hostname: "localhost", port: 8097 });
