import type { ShortenedUrl } from "../api-types.d.ts"
import LongArrowDownRight from "../assets/iconoir/long-arrow-down-right.svg"
import { CopyUrlButton, DeleteUrlButton, QRCodeButton } from "./UrlCardButtons.tsx"

interface UrlCardProps {
  url: ShortenedUrl
  password: string
  refetch: () => void
}

export const UrlCard = ({ url, password, refetch }: UrlCardProps) => {
  return (
    <li class="block w-full rounded-lg p-4 shadow">
      <div class="flex justify-between">
        <a href={url.target_url} class="font-display font-semibold">
          furs.id{url.short_url}
        </a>
        <div class="relative flex gap-2">
          <CopyUrlButton shortUrl={url.short_url} />
          <QRCodeButton shortUrl={url.short_url} />
          <DeleteUrlButton shortUrl={url.short_url} password={password} refetch={refetch} />
        </div>
      </div>

      <div class="gap flex font-light text-gray-500 text-sm">
        <img src={LongArrowDownRight} alt="" />
        <p class="mt-1 line-clamp-1">{url.target_url}</p>
      </div>
      <div class="mt-2 flex w-full">
        <label class="inline-flex cursor-pointer items-center">
          <input type="checkbox" value="" class="peer sr-only" checked={true} />
          <span class="mx-2 font-light text-gray-900 text-sm">Active</span>
          <div class="peer rtl:peer-checked:after:-translate-x-full relative h-5 w-9 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-pink-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800" />
        </label>
      </div>
    </li>
  )
}
