/* @refresh reload */
import { render } from "solid-js/web"

import "../index.css"
import AdminPage from "../Admin.tsx"

const root = document.getElementById("root")

render(() => <AdminPage />, root!)
