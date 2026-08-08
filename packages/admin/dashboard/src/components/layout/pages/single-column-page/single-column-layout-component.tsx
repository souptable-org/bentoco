import type { ReactElement } from "react"
import { clx } from "@bentoco/ui"
import { LayoutComponentProps } from "../../../layout-composer/types"

export const SingleColumnLayoutComponent = ({
  sections,
  className,
}: LayoutComponentProps): ReactElement => {
  return (
    <div className={clx("flex flex-col gap-y-3", className)}>
      {sections["main"]}
    </div>
  )
}
