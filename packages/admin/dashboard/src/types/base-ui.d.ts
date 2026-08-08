declare module "@base-ui/react/merge-props" {
  export function mergeProps(...args: any[]): any
}

declare module "@base-ui/react/use-render" {
  export function useRender(...args: any[]): any
}

declare module "@base-ui/react/*" {
  const content: any
  export default content
  export const Dialog: any
  export const Menu: any
  export const PreviewCard: any
  export const ContextMenu: any
  export const Input: any
  export const Popover: any
  export const Progress: any
  export const ScrollArea: any
  export const Select: any
  export const Separator: any
  export const Switch: any
  export const Tabs: any
  export const Tooltip: any
}
