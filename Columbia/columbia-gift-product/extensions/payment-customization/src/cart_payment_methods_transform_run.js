// @ts-check
/**
 * @typedef {import("../generated/api").CartPaymentMethodsTransformRunInput} CartPaymentMethodsTransformRunInput
 * @typedef {import("../generated/api").CartPaymentMethodsTransformRunResult} CartPaymentMethodsTransformRunResult
 */

/** @type {CartPaymentMethodsTransformRunResult} */
const NO_CHANGES = { operations: [] };

function norm(v) {
  return (v || "").toString().trim().toLowerCase();
}

// Only productType values considered as "gift" (edit/add exact values your store uses)
const giftProductTypes = [
  "gift card",
  "gift cards",
  "gift-card",
  "giftcards",
  "gift",
];

function isTypeGift(productTypeLower) {
  if (!productTypeLower) return false;

  for (const t of giftProductTypes) {
    if (productTypeLower === t) return true; // exact match
    if (productTypeLower.includes(t)) return true; // contains (covers slight variations)
  }
  return false;
}

export function cartPaymentMethodsTransformRun(input) {
  try {
    // Debug: lines info (helpful in logs)
    console.error(
      "Cart lines debug:",
      input.cart?.lines?.map((line) => {
        const t = line.merchandise?.__typename;
        const pType = norm(
          line.merchandise?.product?.productType ||
            line.merchandise?.productType
        );
        return { typename: t, productType: pType };
      })
    );

    // Check Gift Product & give the response as true or false
    const hasGiftProduct = (input.cart?.lines || []).some((line) => {
      const typename = line.merchandise?.__typename;
      if (!typename) return false;

      // For product variant lines, check the product.productType only
      if (typename === "ProductVariant") {
        const productType = norm(line.merchandise?.product?.productType);
        return isTypeGift(productType);
      }

      // Generic fallback: check any productType available on merchandise
      const fallbackType = norm(
        line.merchandise?.product?.productType || line.merchandise?.productType
      );
      return isTypeGift(fallbackType);
    });

    // Not hasGiftProduct retun NO_CHANGES & log
    if (!hasGiftProduct) {
      console.error("No product with matching productType found. No change.");
      return NO_CHANGES;
    }

    // Log for debug
    console.error(
      "Product with gift productType detected — hiding COD-style payment methods."
    );

    // Keywords to detect COD payment methods (normalized lowercase)
    const codKeywords = ["cash on delivery", "cod", "cashondelivery", "cash"];

    const hidePaymentMethod = (input.paymentMethods || []).find((method) => {
      // Get payment name
      const nameLower = norm(method?.name);

      if (!nameLower) return false;

      // Check the COD
      for (const kw of codKeywords) {
        if (nameLower.includes(kw)) {
          // avoid false positives on generic "cash" unless paired with delivery/cod
          if (kw === "cash") {
            if (nameLower.includes("delivery") || nameLower.includes("cod"))
              return true;
            continue;
          }
          return true;
        }
      }
      return false;
    });

    if (!hidePaymentMethod) {
      console.error("No COD-style payment method found to hide.");
      return NO_CHANGES;
    }

    // Log for debug
    console.error("Hiding payment method:", hidePaymentMethod);

    return {
      operations: [
        {
          paymentMethodHide: { paymentMethodId: hidePaymentMethod.id },
        },
      ],
    };
  } catch (err) {
    console.error("Error in cartPaymentMethodsTransformRun:", err);
    return NO_CHANGES;
  }
}
