import { PlusMini } from "@bentoco/icons"
import { IconButton } from "@bentoco/ui"

export default function IconButtonLoading() {
  return (
    <IconButton isLoading className="relative">
      <PlusMini />
    </IconButton>
  )
}
