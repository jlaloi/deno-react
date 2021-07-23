import { Application, Router } from "https://deno.land/x/oak@v8.0.0/mod.ts";

import { React, ReactDOMServer } from "./dep.ts";

import { App } from "./components/App.tsx";

const { diagnostics, files } = await Deno.emit(
  new URL("main.tsx", import.meta.url),
  {
    bundle: "module",
    compilerOptions: {
      lib: ["dom", "dom.iterable", "esnext"],
      target: "es2015",
    },
  },
);

const data: string[] = [];

const router = new Router();
router
  .get("/", (context) => {
    const app = ReactDOMServer.renderToString(
      <App />,
    );
    context.response.type = "text/html";
    context.response.body = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
  })
  .get("/api", ({ response }) => (response.body = { data }))
  .post("/api", async ({ request, response }) => {
    const body = request.body({ type: "json" });
    const value = await body.value;
    data.push(value.newData);
    response.body = { data };
  });

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

await app.listen({ hostname: "localhost", port: 8097 });
