import { createSignal } from "solid-js"
import type { CreateShortenedUrlDto } from "../api-types.d.ts"
import xMark from "../assets/iconoir/xmark.svg"
import Spinner from "../assets/spinner.svg"
import { API_URL, DISPLAY_BASE_URL } from "../constants.ts"

type CreateShortUrlDialogProps = {
  ref: HTMLDialogElement
  password: string
  refetch: VoidFunction
  onClose?: VoidFunction
}

export const CreateShortUrlDialog = (props: CreateShortUrlDialogProps) => {
  const [isSubmitting, setIsSubmitting] = createSignal(false)

  let shortUrlInput!: HTMLInputElement
  let destinationUrlInput!: HTMLInputElement
  let commentInput!: HTMLTextAreaElement

  const onSubmit = async () => {
    setIsSubmitting(true)

    await fetch(`${API_URL}/api/url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${props.password}`
      },
      body: JSON.stringify({
        short_url: `/${shortUrlInput.value}`,
        target_url: destinationUrlInput.value.startsWith("http")
          ? destinationUrlInput.value
          : `https://${destinationUrlInput.value}`,
        comment: commentInput.value
      } satisfies CreateShortenedUrlDto)
    })

    setIsSubmitting(false)
    props.onClose?.()
    props.refetch()
  }

  return (
    <dialog
      ref={props.ref}
      class="fixed inset-0 z-50 m-0 hidden h-screen max-h-full w-screen max-w-full items-center backdrop-blur-sm transition-all open:flex open:bg-gray-900/10"
    >
      <form class="mx-auto w-full max-w-screen-sm rounded-xl border border-gray-400 bg-gray-50 px-4 py-4">
        <div class="flex justify-between">
          <h1 class="font-bold font-display text-gray-800 text-lg">Create new URL</h1>
          <button
            type="button"
            class="rounded-full p-2 hover:bg-red-100 focus:bg-red-100"
            onclick={props.onClose}
          >
            <img src={xMark} class="h-4 w-4" alt="Close" />
          </button>
        </div>

        <div class="items-center gap-2 sm:flex">
          <label for="short-url" class="mt-2 block flex-1 text-gray-600 text-sm">
            Short Link
            <div class="flex rounded border-2">
              <span class="border-r bg-gray-100 px-2 py-1 text-gray-700 text-sm">
                https://{DISPLAY_BASE_URL}/
              </span>
              <input
                ref={shortUrlInput}
                id="short-url"
                type="text"
                class="w-full px-2 py-1 text-sm"
                autofocus={true}
                placeholder="(optional)"
              />
            </div>
          </label>

          <div class="hidden px-4 sm:block">&rarr;</div>

          <div class="flex-1">
            <label for="destination-url" class="mt-2 block text-gray-600 text-sm">
              Destination URL
            </label>
            <input
              ref={destinationUrlInput}
              required={true}
              id="destination-url"
              type="text"
              class="w-full rounded border-2 px-2 py-1 text-sm"
              placeholder="https://..."
            />
          </div>
        </div>

        <label for="comment" class="mt-2 block text-gray-600 text-sm">
          Comment
        </label>
        <textarea
          ref={commentInput}
          id="comment"
          class="w-full rounded border-2 px-2 py-1 text-sm"
          placeholder="(Optional for housekeeping purposes; brief description of what the link is for)"
        />

        <button
          class="mt-4 flex gap-2 rounded-lg bg-pink-500 px-4 py-2 text-pink-50 text-sm disabled:cursor-progress disabled:bg-pink-600 disabled:text-pink-100"
          onClick={onSubmit}
          disabled={isSubmitting()}
          type="button"
        >
          {isSubmitting() && (
            <img src={Spinner} class="-ml-1 h-5 w-5 animate-spin text-pink-50" alt="Submitting.." />
          )}
          {isSubmitting() ? "Submitting.." : "Submit"}
        </button>
      </form>
    </dialog>
  )
}
