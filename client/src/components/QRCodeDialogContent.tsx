import { toDataURL } from "qrcode"
import { createSignal, onMount } from "solid-js"
import { DISPLAY_BASE_URL } from "../constants.ts"

interface QrCodeDialogContentProps {
  shortUrl: string
}

const QRCodeDialogContent = (props: QrCodeDialogContentProps) => {
  const [qrCodeImageData, setQrCodeImageData] = createSignal<string>()

  onMount(() => {
    toDataURL(
      // @ts-expect-error - Apparently this is a valid argument
      undefined,
      `https://${DISPLAY_BASE_URL}${props.shortUrl}`,
      {
        errorCorrectionLevel: "high",
        scale: 16
      },
      (_error, url) => {
        setQrCodeImageData(url)
      }
    )
  })

  return (
    <>
      <img src={qrCodeImageData()} class="mx-auto mt-2 h-64 w-64" alt="" />

      <a
        href={qrCodeImageData()}
        download={`${DISPLAY_BASE_URL}${props.shortUrl.replace("/", "_")}.png`}
        class="mx-auto mt-4 block w-full rounded-full bg-pink-500 px-4 py-2 text-center text-pink-50"
      >
        Download
      </a>
    </>
  )
}

export default QRCodeDialogContent
