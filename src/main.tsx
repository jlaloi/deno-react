import { React, ReactDOM } from "../depFront.ts";

import { App } from "./components/App.tsx";

ReactDOM.hydrate(
  <App />,
  // @ts-ignore: dom libs will be provided with emit
  document.getElementById("app"),
);
