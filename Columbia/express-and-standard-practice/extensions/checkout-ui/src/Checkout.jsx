import {
  reactExtension,
  Banner,
  useCartLines,
  useShippingAddress,
  useApplyAttributeChange,
  useAttributes,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect } from "react";
// import papaparse for converting csv to json format
import Papa from "papaparse";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  // add attribute
  const applyAttributeChange = useApplyAttributeChange();
  const attributes = useAttributes();

  // cart products
  const cartdata = useCartLines();
  // user input zip code
  const shippingAddress = useShippingAddress();

  // product sku
  const skuArray = cartdata
    .map((line) => line.merchandise?.sku)
    .filter((sku) => typeof sku === "string" && sku.trim() !== "");

    const skus = skuArray.join(',')
  // product quantity
  const quantity = cartdata
    .map((line) => line.quantity)
    .filter((qty) => typeof qty === "number" && qty > 0)
    .join(",");

  // log zip code, sku & quantity for debugging
  // console.log("zip code: ", shippingAddress.zip);
  // console.log("sku: ", skus);
  // console.log("quantity: ", quantity);

  useEffect(() => {
    const fetchCsvData = async () => {
      // API
      const apiURL =
        "https://cdn.shopify.com/s/files/1/0620/0970/4612/files/Express_Delivery_PIN_code_1.csv?v=1756893132";
      // get the csv file data
      const ApiUrl = apiURL.replace(/(\?v=)\d+/, "");
      const response = await fetch(ApiUrl);
      const result = await response.text();
      // console.log("result: ", result);

      // converting csv data to json format
      const parsed = Papa.parse(result, {
        header: true,
        skipEmptyLines: true,
      });

      const data = parsed.data.filter((item) => item?.Pincode);
      // console.log("data", data);

      // select the match pincode by searching the user pincode input to csv file
      const matchedPincode = data.find((item) => {
        return item.Pincode === shippingAddress.zip;
      });

      // check is user Pincode Match with csv file data
      const isPincodeMatch = matchedPincode?.Pincode === shippingAddress.zip;
      // console.log("is pincode Match: ", isPincodeMatch);

      // if isPincodeMatch is true
      if (isPincodeMatch === true) {
        // store the matched store_codes
        const store_code = [
          matchedPincode.store_code_1 ?? 0,
          matchedPincode.store_code_2 ?? 0,
          matchedPincode.store_code_3 ?? 0,
          matchedPincode.store_code_4 ?? 0,
          matchedPincode.store_code_5 ?? 0,
        ]
          .map((code) => parseInt(code || "0"))
          .filter((code) => !isNaN(code))
          .join(",");
        // console.log(store_code);
        // api request data
        const requestData = new URLSearchParams({
          channel: "Shopify_columbia",
          pincode: shippingAddress?.zip?.toString(),
          items: skus,
          quantity: quantity,
          store_code: store_code,
        });

        // fetch api
        const expressRes = await fetch(
          "https://mdlw.chogoriindia.com/check-express-delivery-new",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
            },
            body: requestData,
          }
        );

        // Api response
        const expressResult = await expressRes.json();
        console.log("expressResult: ", expressResult.express_pincode);

        if (expressResult.express_pincode === true) {
          await applyAttributeChange({
            key: "dataOfShipping",
            type: "updateAttribute",
            value: "Express_pincode_available",
          });
        } else {
          await applyAttributeChange({
            key: "dataOfShipping",
            type: "updateAttribute",
            value: "Standard_pincode_available",
          });
        }
        // console.log("applyAttributeChange: ", applyAttributeChange);
        } else if (isPincodeMatch == false) {
        await applyAttributeChange({
          key: "dataOfShipping",
          type: "updateAttribute",
          value: "Standard_pincode_available",
        });
        }
    };

    fetchCsvData();
  }, [shippingAddress.zip]);

  console.log("attributes: ", attributes);


  return <Banner>This is a express & standard</Banner>;
}


// full task logic description
/*
  - the task is i have to show the express delivery serviceable according to user zip code if yes then show otherwise not.

  logics : 
  
  *checkout UI*
  - first i access the user input zip code.
  - searching the user's zipcode in csv's json file after converting csv to json.
  - then i get the stores by searching zip code.
  - sending the pincode, items-sku, quantity, store code: "","","","","" in api and getting in response value Standard_pincode_available or Express_pincode_available
  - i am storing this Api response in an attribute

  *delivery customization function*
  - accessing the attriute in shopify function and according to the response if the attribute is Express_pincode_available then only show the express delivery option else if it is Standard_pincode_available then remove it.
  
*/