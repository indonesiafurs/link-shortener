import { makePersisted } from "@solid-primitives/storage"
import { For, Match, Switch, createResource, createSignal, onMount } from "solid-js"
import EyeClosed from "./assets/iconoir/eye-closed.svg"
import EyeOpen from "./assets/iconoir/eye-solid.svg"
import { AppHeader } from "./components/AppHeader.tsx"
import { CreateShortUrlDialog } from "./components/CreateUrlDialog.tsx"
import { UrlCard } from "./components/UrlCard.tsx"
import { API_URL } from "./constants.ts"

function App() {
  const [password, setPassword] = makePersisted(createSignal<string>(), { name: "password" })
  const [showPassword, setShowPassword] = createSignal(false)

  let newUrlDialogRef!: HTMLDialogElement
  let passwordInputRef!: HTMLInputElement

  const [shortUrls, { refetch }] = createResource(password, () => {
    return fetch(`${API_URL}/api/urls`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${password()}`
      }
    }).then((res) => res.json())
  })

  onMount(() => {
    if (password() != null) passwordInputRef.value = password()!
  })

  const onShortUrlsFetch = () => {
    setPassword(passwordInputRef.value)
    refetch()
  }

  return (
    <>
      <AppHeader />

      <main class="relative mx-auto mt-20 max-w-screen-lg px-6 lg:mt-32">
        <section class="max-w-96">
          <h1 class="font-bold font-display text-gray-700 text-xl">Admin Password</h1>
          <div class="flex gap-2">
            <fieldset class="mt-1 inline-flex w-full flex-1 rounded-md border-2 border-gray-300 p-2 text-lg has-[:focus-visible]:border-pink-500">
              <input
                ref={passwordInputRef}
                type={showPassword() ? "text" : "password"}
                placeholder="haii do u rp? x3"
                class="flex-1 shadow-none focus-visible:outline-none"
              />
              <button
                class="mx-auto h-7 w-7"
                onclick={() => setShowPassword((p) => !p)}
                type="button"
              >
                <img src={showPassword() ? EyeOpen : EyeClosed} alt="Toggle password visibility" />
              </button>
            </fieldset>
            <button
              class="mt-1 h-12 w-12 rounded-md bg-pink-500 font-semibold text-lg text-pink-50"
              onclick={onShortUrlsFetch}
              type="submit"
            >
              &rarr;
            </button>
          </div>
        </section>

        <Switch>
          <Match when={shortUrls.loading}>
            <section>Loading..</section>
          </Match>
          <Match when={shortUrls.error}>
            <section class="mt-4">
              <h1 class="font-bold font-display text-gray-700 text-xl">Error</h1>
              <pre class="max-w-screen-md">{shortUrls.error.message}</pre>
            </section>
          </Match>
          <Match when={shortUrls.latest}>
            <section class="mt-4">
              <div class="flex w-full justify-between">
                <h1 class="font-bold font-display text-gray-700 text-xl">Shortened URLs</h1>
                <button
                  class="rounded-lg bg-pink-500 px-4 py-2 text-pink-50"
                  type="button"
                  onclick={() => newUrlDialogRef.showModal()}
                >
                  New URL
                </button>
              </div>

              <ul class="mt-2 grid md:grid-cols-2">
                <For each={shortUrls.latest}>
                  {(url) => <UrlCard url={url} password={password()!} refetch={refetch} />}
                </For>
              </ul>

              {/* <pre class="mt-4 max-w-screen-md">{JSON.stringify(data.latest, null, 2)}</pre> */}
            </section>
          </Match>
        </Switch>
      </main>

      <CreateShortUrlDialog
        ref={newUrlDialogRef}
        password={password()!}
        refetch={refetch}
        onClose={() => newUrlDialogRef.close()}
      />
    </>
  )
}

export default App
