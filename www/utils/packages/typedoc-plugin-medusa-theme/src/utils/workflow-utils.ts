import {
  DeclarationReflection,
  ProjectReflection,
  ReflectionKind,
} from "typedoc"

export function getWorkflowReflectionFromNamespace(
  project: ProjectReflection,
  reflName: string
): DeclarationReflection | undefined {
  let found: DeclarationReflection | undefined
  project
    .getChildrenByKind(ReflectionKind.Module)
    .find((moduleRef) => moduleRef.name === "core-flows")
    ?.getChildrenByKind(ReflectionKind.Namespace)
    .some((namespace) => {
      found = namespace.getChildByName(reflName) as DeclarationReflection

      return found !== undefined
    })

  return found
}

export function getPackageNameForWorkflowReflection(
  workflowReflection: DeclarationReflection
): string {
  if (workflowReflection.sources?.length) {
    if (workflowReflection.sources[0].fileName.startsWith("plugins/loyalty")) {
      return "@bentoco/loyalty-plugin/workflows"
    }
  }

  return "@bentoco/medusa/core-flows"
}