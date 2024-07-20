/* @refresh reload */
import { render } from "solid-js/web"

import "@fontsource-variable/plus-jakarta-sans"
import "./index.css"
import App from "./App.tsx"

const root = document.getElementById("root")

render(() => <App />, root!)
