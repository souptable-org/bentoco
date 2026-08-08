import { CurrencyInput } from "@bentoco/ui"

export default function CurrencyInputDisabled() {
  return (
    <div className="max-w-[250px]">
      <CurrencyInput
        symbol="€"
        code="eur"
        disabled
        value={"100"}
        aria-label="Amount"
      />
    </div>
  )
}
