"use client"

export default function ChainlinkFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-3">
      <div className="container mx-auto px-4 flex items-center justify-center gap-2">
        <svg width="20" height="20" viewBox="0 0 247 284" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M123.5 0L0 70.9726V212.918L123.5 283.89L247 212.918V70.9726L123.5 0ZM194.679 182.837L123.523 223.728L52.3663 182.837V101.054L123.523 60.1621L194.679 101.054V182.837Z"
            fill="#0847F7"
          />
        </svg>
        <span className="text-xs text-muted-foreground">Powered by Chainlink.</span>
      </div>
    </footer>
  )
}
