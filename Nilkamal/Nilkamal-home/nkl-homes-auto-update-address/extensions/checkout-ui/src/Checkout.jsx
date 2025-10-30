import { reactExtension, Banner, useBillingAddress } from "@shopify/ui-extensions-react/checkout";
import { useEffect } from "react";

export default reactExtension("purchase.checkout.block.render", () => <Extension />);

function Extension() {
  const billingAddress = useBillingAddress();

  useEffect(() => {
    if (!billingAddress) {
      console.log("billingAddress is undefined — either not granted or not present for this checkout");
      return;
    }
    console.log("billingAddress", billingAddress);
  }, [billingAddress]);

  return <Banner>HELLO WORLD</Banner>;
}
