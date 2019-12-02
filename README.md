# Description
API endpoint for importing orders from microsites, such as Pro.Supply.com, Google Nest Pro, etc., into the NetSuite for fulfillment and reporting.



## Headers
**required** `Content-Type: application/json`

**required** `Authorization: NLAuth nlauth_account={NS_ACCT_ID},nlauth_email={NS_EMAIL},nlauth_signature={NS_PW},nlauth_role={NS_ROLE}`



## Body
Accepts a JSON object with the following key-value pairs:


### Required
 **int** `CustomerId`: Internal NetSuite ID of the customer. 

 **string** `SiteOrderNumber`: Purchase Order number from the respective microservice. Populates _otherrefnum_. 

 **Array<object>** `Items`: an array of objects containing the items on the order. Each object must include the following:
      
   **string** `ItemId`: the NetSuite internal ID of the item

   **int** `Quantity`: item quantity

   **int** `Rate`: cost per item

   **int** `Amount`: total item cost (Quantity * Rate)

#### Billing address:
 **string** `BillingFirstName`
 **string** `BillingLastName`
 **string** `BillingLine1`
 **string** `BillingLine2`
 **string** `BillingCity`
 **string** `BillingState`
 **string** `BillingZip`
 **string** `BillingCountry`

#### Shipping address:
 **string** `ShippingFirstName`
 **string** `ShippingLastName`
 **string** `ShippingLine1`
 **string** `ShippingLine2`
 **string** `ShippingCity`
 **string** `ShippingState`
 **string** `ShippingZip`
 **string** `ShippingCountry`
 **string** `ShippingPhone`


### Optional
 **string** `AltOrderNumber`: The payment processing ID. Populates _custbody270_ (Processing Gateway ID).

 **string** `JobName`: The customer's job name they are purchasing for. Populates _custbody61_.

 **string** `DiscountNames`: Name(s) of discounts/coupons used. Populates _custbody209_ (Coupon Code Used).

 **string** `IPAddress`: IP Address of the purchaser. Populates _custbody267_ (IP Address).

 **string** `RelatedEstimate`: The NetSuite internal ID of the related estimate. _Important_: if the sale was converted from an estimate, providing this ID will ensure all item quantities and rates match the estimate.

**string** `SignifydID`: ID used for Signifyd fraud check. Populates _custbody277_ (Signifyd Case ID).

**string** `Microsite`: The ID of the microsite (Amazon, Pro.Supply.Com, Nest Pro, etc.). Populates _custbody242_ (Microsite).

**int** `Department`: NetSuite department ID. Most frequently, 29 (Pro Sales) or 27 (D2C). Populates _department_.

**string** `UserTypeId`: The ID of the user category type (plumber, contractor, etc.). _Note: Google Nest orders default to General Contractor_. Populates _custbody28_ (Category).

**string** `CheckoutTypeId`: The ID of the checkout type used during the transaction (Amazon Marketplace, PayPal, etc.). Populates _custbody40_ (Order Type).

 **string** `Email`: The email used during purchase.

 **string** `PhoneNumber`: The phone number used during purchase.

**string** `ShippingMethodName`: The specific type of shipping. Populates 'shipmethod' in NetSuite.
   _Options_: "UPS Ground", "UPS 2nd Day Air", "UPS 2nd Day Air A.M.", "UPS 3 Day Select", "UPS Freight", "UPS Freight LTL Guaranteed", "UPS Next Day Air", "UPS Next Day Air Early A.M."


**string** `Note`: Order comments. Populates 'memo'  in NetSuite.

**int** `SH`: Shipping and handling cost. Defaults to 0.00.

**int** `PaymentMethodId`: The NetSuite internal ID of the payment method used during checkout (Credit card, PayPal, Amazon Marketplace, etc.). Populates _paymentmethod_. Defaults to _Credit Card_.

**bool** `PersonalItem`: A flag used to identify if the item is for personal-use only. Defaults to `false`. _Note_: this is currently only used for Google Nest Pro orders.



## Example Request
```
{
   "CustomerId": 17494445,
   "SiteOrderNumber": "897654654",
   "AltOrderNumber": "61954029542",
   "Email": "BarryBlock@GeneCousineauActingStudio.com",
   "PhoneNumber": "214-264-6874",
   "BillingFirstName": "Barry",
   "BillingLastName": "Block",
   "BillingLine1": "7219 Centenary Ave",
   "BillingLine2": "Unit A",
   "BillingCity": "Los Angeles",
   "BillingState": "CA",
   "BillingZip": "90066",
   "BillingCountry": "US",
   "ShippingFirstName": "Gene",
   "ShippingLastName": "Parmesan",
   "ShippingLine1": "311 Amber Lane",
   "ShippingLine2": "Apt B",
   "ShippingCity": "Ventura",
   "ShippingState": "CA",
   "ShippingZip": "93001",
   "ShippingCountry": "US",
   "ShippingPhone": "212-974-4854",
   "Note": "This is a valuable customer",
   "SH": 50.00,
   "ShippingMethodName": "UPS 2nd Day Air Early A.M.",
   "JobName": "Studio construction",
   "DiscountNames": "SPR8784",
   "IPAddress": "99.203.23.226",
   "RelatedEstimate": "EST98784561",
   "SignifydID": "1129543835",
   "Microsite": 27,
   "Department": 29,
   "UserTypeId": 2,
   "CheckoutTypeId": 4,
   "PaymentMethodId": 1,
   "SameDayShipping": 1,
   "PersonalItem": false
   "Items": [
      {
        "ItemId": "10268",
        "Quantity": 2,
        "Rate": 120.00,
        "Amount": 240.00,
      },
      {
        "ItemId": "78945",
        "Quantity": 3,
        "Rate": 100.00,
        "Amount": 300.00,
      }
   ]
}
```



## Returns
`application/json`



### Example Success Response
```
{
   "salesOrderRecordId": "7154894614"
}
```


### Example Error Response
```
{
   "error": "Invalid customer id."
}
```

