import IFLogo from "../assets/logo.svg"

export const AppHeader = () => (
  <header class="flex h-16 w-full items-center px-6 py-2 backdrop-blur">
    <div class="container z-10 mx-auto flex h-full items-center justify-between space-x-4">
      <div class="flex flex-grow items-center">
        <a
          class="inline-flex flex-shrink-0 items-center gap-2 font-bold font-display text-gray-700 text-lg"
          href="/"
        >
          <img src={IFLogo} height={32} width={32} alt="Indonesia Furs Link Shortener" />
          <span>Link Shortener</span>
        </a>
      </div>
    </div>
  </header>
)
