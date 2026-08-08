import { InformationCircleSolid } from "@bentoco/icons"
import { Tooltip } from "@bentoco/ui"

export default function TooltipDemo() {
  return (
    <Tooltip content="The quick brown fox jumps over the lazy dog.">
      <InformationCircleSolid />
    </Tooltip>
  )
}
