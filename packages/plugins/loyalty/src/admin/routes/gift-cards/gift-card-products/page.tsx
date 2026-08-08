import { defineRouteConfig } from "@bentoco/admin-sdk"
import { LayoutComposer } from "@bentoco/dashboard/components"
import { Toaster } from "@bentoco/ui"
import { GiftCardProductsTable } from "./components/gift-card-products-table/gift-card-products-table"

const GiftCardProductsPage = () => {
  return (
    <>
      <LayoutComposer
        widgetsZonePrefix="gift_card_product.list"
        preferredLayoutId="core:single-column"
        sections={{
          main: (
            <LayoutComposer.Entry id="GiftCardProductsTable">
              <GiftCardProductsTable />
            </LayoutComposer.Entry>
          ),
        }}
      />

      <Toaster />
    </>
  )
}

export const config = defineRouteConfig({
  label: "Gift Card Products",
})

export default GiftCardProductsPage
