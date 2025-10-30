/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").CartDeliveryOptionsTransformRunResult} CartDeliveryOptionsTransformRunResult
 */

/** @type {CartDeliveryOptionsTransformRunResult} */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {RunInput} input
 * @returns {CartDeliveryOptionsTransformRunResult}
 */
export function cartDeliveryOptionsTransformRun(input) {
  // Read the single attribute object we requested in the GraphQL query:
  // attribute(key: "dataOfShipping") { key value }
  const attributeObj = input?.cart?.attribute;
  const attributeValue = attributeObj?.value;

  // If attribute says Standard, hide Express delivery options
  if (attributeValue === "Standard_pincode_available") {
    /** @type {CartDeliveryOptionsTransformRunResult['operations']} */
    const operations = [];

    if (input.cart?.deliveryGroups) {
      input.cart.deliveryGroups.forEach((group) => {
        if (group.deliveryOptions) {
          group.deliveryOptions.forEach((option) => {
            if (
              option.title &&
              typeof option.title === "string" &&
              option.title.toLowerCase().includes("express")
            ) {
              operations.push({
                deliveryOptionHide: {
                  deliveryOptionHandle: option.handle,
                },
              });
            }
          });
        }
      });
    }

    if (operations.length === 0) return NO_CHANGES;
    return { operations };
  }

  // If attribute says Express (or missing/any other value), leave everything unchanged
  return NO_CHANGES;
}
