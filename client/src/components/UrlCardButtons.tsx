import { writeClipboard } from "@solid-primitives/clipboard"
import { useKeyDownList } from "@solid-primitives/keyboard"
import { makeTimer } from "@solid-primitives/timer"
import { createSignal, lazy } from "solid-js"
import type { DeleteShortenedUrlDto } from "../api-types.d.ts"
import Copy from "../assets/iconoir/copy.svg"
import qrCode from "../assets/iconoir/qr-code.svg"
import xMark from "../assets/iconoir/xmark.svg"
import { API_URL } from "../constants.ts"

interface CopyUrlButtonProps {
  shortUrl: string
}

export const CopyUrlButton = (props: CopyUrlButtonProps) => {
  const [hasClickedBefore, setHasClickedBefore] = createSignal(false)

  const onCopyUrl = () => {
    writeClipboard(`https://furs.id${props.shortUrl}`)
    setHasClickedBefore(true)
    return makeTimer(
      () => {
        setHasClickedBefore(false)
      },
      1000,
      setTimeout
    )
  }

  return (
    <>
      <button
        class="peer/copy h-6 w-6 rounded-full border bg-gray-50 p-1"
        type="button"
        onclick={onCopyUrl}
      >
        <img src={Copy} class="h-4 w-4" alt="Copy to clipboard" />
      </button>
      <div
        class="-top-9 pointer-events-none absolute left-0 hidden select-none rounded p-1 px-2 text-neutral-500 text-sm shadow-lg peer-hover/copy:block peer-focus/copy:block"
        // biome-ignore lint/nursery/useSemanticElements: No HTML element with role tooltip
        role="tooltip"
        inert={true}
      >
        {hasClickedBefore() ? "Copied!" : "Copy"}
      </div>
    </>
  )
}

interface QrCodeButtonProps {
  shortUrl: string
}

const QRCodeDialogContent = lazy(() => import("./QRCodeDialogContent.tsx"))

export const QRCodeButton = (props: QrCodeButtonProps) => {
  const [isModalOpen, setIsModalOpen] = createSignal(false)
  let qrCodeDialogRef!: HTMLDialogElement

  const onShowQrCode = () => {
    qrCodeDialogRef.showModal()
    setIsModalOpen(true)
  }
  const onCloseQrCode = () => {
    qrCodeDialogRef.close()
  }

  return (
    <>
      <button
        class="peer/qrcode h-6 w-6 rounded-full border bg-gray-50 p-1"
        type="button"
        onclick={onShowQrCode}
      >
        <img src={qrCode} class="h-4 w-4" alt="Show QR Code" />
      </button>
      <div
        class="-top-9 pointer-events-none absolute left-2 hidden select-none rounded p-1 px-2 text-neutral-500 text-sm shadow-lg peer-hover/qrcode:block peer-focus/qrcode:block"
        // biome-ignore lint/nursery/useSemanticElements: No HTML element with role tooltip
        role="tooltip"
        inert={true}
      >
        Show QR
      </div>

      <dialog
        ref={qrCodeDialogRef}
        class="fixed inset-0 z-50 m-0 hidden h-screen max-h-full w-screen max-w-full items-center bg-gray-900/10 backdrop-blur-sm open:flex"
      >
        <div class="mx-auto w-96 rounded-xl border border-gray-400 bg-gray-50 px-4 py-4">
          <div class="flex justify-between">
            <h1 class="font-display font-medium text-gray-800 text-lg">
              QR Code for <b>furs.id{props.shortUrl}</b>
            </h1>
            <button
              type="button"
              class="rounded-full p-2 hover:bg-red-100 focus:bg-red-100"
              onclick={onCloseQrCode}
            >
              <img src={xMark} class="h-4 w-4" alt="Close" />
            </button>
          </div>
          {isModalOpen() && <QRCodeDialogContent shortUrl={props.shortUrl} />}
        </div>
      </dialog>
    </>
  )
}

interface DeleteUrlButtonProps {
  shortUrl: string
  password: string
  refetch: () => void
}

export const DeleteUrlButton = (props: DeleteUrlButtonProps) => {
  const key = useKeyDownList()
  const [hasClickedBefore, setHasClickedBefore] = createSignal(false)

  const onDeleteUrl = async () => {
    // Bypass the 1s delay if the user has pressed shift
    // biome-ignore lint/complexity/useSimplifiedLogicExpression: More straightforward like this lmao
    if (!hasClickedBefore() && !key().includes("Shift")) {
      setHasClickedBefore(true)
      return makeTimer(
        () => {
          setHasClickedBefore(false)
        },
        2000,
        setTimeout
      )
    }

    await fetch(`${API_URL}/api/url`, {
      method: "DELETE",
      body: JSON.stringify({ short_url: props.shortUrl } satisfies DeleteShortenedUrlDto),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${props.password}`
      }
    })
    await props.refetch()
  }

  return (
    <>
      <button
        class="peer/delete h-6 w-6 rounded-full border border-red-500 bg-red-50 p-1"
        type="button"
        onclick={onDeleteUrl}
      >
        <img src={xMark} class="h-4 w-4" alt="Show QR Code" />
      </button>
      <div
        class="-top-9 pointer-events-none absolute right-0 hidden select-none rounded p-1 px-2 text-neutral-500 text-sm shadow-lg peer-hover/delete:block peer-focus/delete:block"
        // biome-ignore lint/nursery/useSemanticElements: No HTML element with role tooltip
        role="tooltip"
        inert={true}
      >
        {hasClickedBefore() ? "Confirm?" : "Delete"}
      </div>
    </>
  )
}
