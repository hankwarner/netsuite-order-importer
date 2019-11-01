const httpRequest = require("./Helpers/HttpRequest");
const orderNumberGenerator = require("./Helpers/OrderNumberGenerator");
var websiteOrderImpoterSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1779&deploy=1&compid=634494_SB1&h=e2c8c227c3eb3b838b7a";
var websiteOrderImporterRESTletUrl = "https://634494-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=1778&deploy=1";
const headers = {
    "Content-Type": "application/json",
    "Authorization": "NLAuth nlauth_account=634494_SB1,nlauth_email=wildcat@hmwallace.com,nlauth_signature=March2015!,nlauth_role=1030"
}


describe("Import Orders From Supply.com", () => {

    describe("Create a new Sales Order without a Related Estimate", () => {

        beforeAll(() => {
            this.orderWithoutRelatedEstimate = {
                CustomerId: "17494445",
                SiteOrderNumber: orderNumberGenerator.generateOrderNumber(),
                Email: "BarryBlock@GeneCousineauActingStudio.com",
                BillingFirstName: "Barry",
                BillingLastName: "Block",
                JobName: "Gene Cousineau's Acting Studio",
                Department: "29",
                SameDayShipping: "3",
                BillingLine1: "311 Amber Lane",
                BillingLine2: "Apt B",
                BillingCity: "Ventura",
                BillingState: "CA",
                BillingZip: "90754",
                ShippingFirstName: "Sally",
                ShippingLastName: "Reed",
                ShippingLine1: "141 Tupelo Dr.",
                ShippingLine2: "Unit 605",
                ShippingCity: "Santa Monica",
                ShippingState: "CA",
                ShippingZip: "91578",
                ShippingCountry: "US",
                Note: "This is a test note",
                SH: 10,
                ShippingMethodName: "UPS Ground",
                DiscountNames: "Super Savings",
                IPAddress: "68.191.240.43",
                RelatedEstimate: null,
                SignifydID: "1154999499",
                Microsite: "27",
                CheckoutTypeId: "4",
                PaymentMethodId: "12",
                SameDayShipping: "2",
                Items: [
                    {
                        ItemId: "197145",
                        Quantity: 1,
                        Rate: 903.26,
                        Amount: 903.26,
                        DiscountNames: "Super Duper Saver",
                        OrderLevelDiscountAmount: 15,
                        ItemNotes: "this item rules",
                        ItemName: "K-6489-0"
                    },
                    {
                        ItemId: "1808976",
                        Quantity: 3,
                        Rate: 1506.45,
                        Amount: 1506.45,
                        DiscountNames: "Triple Saver",
                        OrderLevelDiscountAmount: 15,
                        ItemNotes: "this item rules",
                        ItemName: "RU199iN"
                    }
                ]
            }
            
            this.request = JSON.stringify(this.orderWithoutRelatedEstimate);

            // Send request to the WebsiteOrderImporterRESTlet
            this.restletResponse = httpRequest.post({
                url: websiteOrderImporterRESTletUrl,
                body: this.orderWithoutRelatedEstimate,
                headers: headers
            });
            // Store the sales order record id
            this.salesOrderRecordId = JSON.parse(this.restletResponse.body).salesOrderRecordId;
            websiteOrderImpoterSpecControllerUrl += "&functionType=create";
            websiteOrderImpoterSpecControllerUrl += "&salesOrderRecordId="+this.salesOrderRecordId;
        
            // Send to the controller to get the field values and store the response
            this.controllerResponse = httpRequest.get(websiteOrderImpoterSpecControllerUrl);
        });

        test("should create a new sales order record and return the sales order record id", () => {
            expect(this.salesOrderRecordId).not.toBeNull();
        });

        test("should set the payment infomation fields", () => {
            expect(this.controllerResponse.PaymentMethodId).toBe(this.orderWithoutRelatedEstimate.PaymentMethodId);
            expect(this.controllerResponse.SH).toBe(this.orderWithoutRelatedEstimate.SH);
            expect(this.controllerResponse.SignifydID).toBe(this.orderWithoutRelatedEstimate.SignifydID);
            expect(this.controllerResponse.DiscountNames).toBe(this.orderWithoutRelatedEstimate.DiscountNames);
            expect(this.controllerResponse.CheckoutTypeId).toBe(this.orderWithoutRelatedEstimate.CheckoutTypeId);
            expect(this.controllerResponse.Taxable).toBeTruthy();
        });

        test("should set the general infomation fields", () => {
            expect(this.controllerResponse.BrontoId).toBe(this.orderWithoutRelatedEstimate.SiteOrderNumber);
            expect(this.controllerResponse.Email).toBe(this.orderWithoutRelatedEstimate.Email);
            expect(this.controllerResponse.Department).toBe(this.orderWithoutRelatedEstimate.Department);
            expect(this.controllerResponse.Note).toBe(this.orderWithoutRelatedEstimate.Note);
            expect(this.controllerResponse.BrontoId).toBe(this.orderWithoutRelatedEstimate.SiteOrderNumber);
        });

        test("should set the order infomation fields", () => {
            expect(this.controllerResponse.SiteOrderNumber).toBe(this.orderWithoutRelatedEstimate.SiteOrderNumber);
            expect(this.controllerResponse.SameDayShipping).toBe(this.orderWithoutRelatedEstimate.SameDayShipping);
            expect(this.controllerResponse.JobName).toBe(this.orderWithoutRelatedEstimate.JobName);
        });

        test("should set the website infomation fields", () => {
            expect(this.controllerResponse.Microsite).toBe(this.orderWithoutRelatedEstimate.Microsite);
            expect(this.controllerResponse.IPAddress).toBe(this.orderWithoutRelatedEstimate.IPAddress);
        });

        test("should set the billing address", () => {
            expect(this.controllerResponse.BillingAddressee).toBe(this.orderWithoutRelatedEstimate.BillingFirstName.concat(" "+this.orderWithoutRelatedEstimate.BillingLastName));
            expect(this.controllerResponse.BillingLine1).toBe(this.orderWithoutRelatedEstimate.BillingLine1);
            expect(this.controllerResponse.BillingLine2).toBe(this.orderWithoutRelatedEstimate.BillingLine2);
            expect(this.controllerResponse.BillingCity).toBe(this.orderWithoutRelatedEstimate.BillingCity);
            expect(this.controllerResponse.BillingState).toBe(this.orderWithoutRelatedEstimate.BillingState);
            expect(this.controllerResponse.BillingZip).toBe(this.orderWithoutRelatedEstimate.BillingZip);
        });

        test("should set the shipping address", () => {
            expect(this.controllerResponse.ShippingAddressee).toBe(this.orderWithoutRelatedEstimate.ShippingFirstName.concat(" "+this.orderWithoutRelatedEstimate.ShippingLastName));
            expect(this.controllerResponse.ShippingLine1).toBe(this.orderWithoutRelatedEstimate.ShippingLine1);
            expect(this.controllerResponse.ShippingLine2).toBe(this.orderWithoutRelatedEstimate.ShippingLine2);
            expect(this.controllerResponse.ShippingCity).toBe(this.orderWithoutRelatedEstimate.ShippingCity);
            expect(this.controllerResponse.ShippingState).toBe(this.orderWithoutRelatedEstimate.ShippingState);
            expect(this.controllerResponse.ShippingZip).toBe(this.orderWithoutRelatedEstimate.ShippingZip);
        });

        test("should set the item lines", () => {
            this.orderWithoutRelatedEstimate.Items.forEach(element => {
                var lineItemId = element.ItemId;
                var controllerResponseItem = this.controllerResponse.lineItemValues[lineItemId];
                var totalAmount = element.Quantity * element.Rate;
                
                expect(controllerResponseItem.quantity).toBe(element.Quantity);
                expect(controllerResponseItem.amount).toBe(totalAmount);
                expect(controllerResponseItem.rate).toBe(element.Rate);
                expect(controllerResponseItem.discountName).toBe(element.DiscountNames);
                expect(controllerResponseItem.itemNotes).toBe(element.ItemNotes);
                expect(controllerResponseItem.orderLevelDiscount).toBe(element.OrderLevelDiscountAmount);
            });
        });

        //Reset the Suitelet url to its original form
        afterAll(() => {
            websiteOrderImpoterSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1779&deploy=1&compid=634494_SB1&h=e2c8c227c3eb3b838b7a";
        });
    });

    describe("Create a new Sales Order with a Related Estimate", () => {
        beforeAll(() => {
            this.orderWithRelatedEstimate = {
                CustomerId: "17494445",
                SiteOrderNumber: orderNumberGenerator.generateOrderNumber(),
                Email: "BarryBlock@GeneCousineauActingStudio.com",
                BillingFirstName: "Barry",
                BillingLastName: "Block",
                JobName: "Gene Cousineau's Acting Studio",
                Department: "29",
                SameDayShipping: "3",
                BillingLine1: "311 Amber Lane",
                BillingLine2: "Apt B",
                BillingCity: "Ventura",
                BillingState: "CA",
                BillingZip: "90754",
                ShippingFirstName: "Sally",
                ShippingLastName: "Reed",
                ShippingLine1: "141 Tupelo Dr.",
                ShippingLine2: "Unit 605",
                ShippingCity: "Santa Monica",
                ShippingState: "CA",
                ShippingZip: "91578",
                ShippingCountry: "US",
                Note: "This is a test note",
                SH: 10,
                ShippingMethodName: "UPS Ground",
                DiscountNames: "Super Savings",
                IPAddress: "68.191.240.43",
                SignifydID: "1154999499",
                Microsite: "27",
                CheckoutTypeId: "4",
                PaymentMethodId: "12",
                SameDayShipping: "2",
                Items: [
                    {
                        ItemId: "10268",
                        Quantity: 2,
                        Rate: 120.00,
                        Amount: 240.00,
                        ItemName: "69000"
                    },
                    {
                        ItemId: "1808976",
                        Quantity: 3,
                        Rate: 1506.45,
                        Amount: 1506.45,
                        ItemName: "RU199iN"
                    }
                ]
            }
            
            // Create an estimate and store the response as the RelatedEstimate
            websiteOrderImpoterSpecControllerUrl += "&functionType=createEstimate";
            this.orderWithRelatedEstimate.RelatedEstimate = httpRequest.get(websiteOrderImpoterSpecControllerUrl);;
            // Remove the function type from the url
            websiteOrderImpoterSpecControllerUrl = websiteOrderImpoterSpecControllerUrl.replace("&functionType=createEstimate", "");

            // Send request to the WebsiteOrderImporterRESTlet
            this.request = JSON.stringify(this.orderWithRelatedEstimate);
            
            this.restletResponse = httpRequest.post({
                url: websiteOrderImporterRESTletUrl,
                body: this.orderWithRelatedEstimate,
                headers: headers
            });

            // Store the sales order record id
            this.salesOrderRecordId = JSON.parse(this.restletResponse.body).salesOrderRecordId;
            websiteOrderImpoterSpecControllerUrl += "&functionType=create";
            websiteOrderImpoterSpecControllerUrl += "&salesOrderRecordId="+this.salesOrderRecordId;
        
            // Send to the controller to get the field values and store the response
            this.controllerResponse = httpRequest.get(websiteOrderImpoterSpecControllerUrl);
        });

        test("should transform a related estimate into a sales order", () => {
            expect(this.salesOrderRecordId).not.toBeNull();
            expect(this.controllerResponse.RelatedEstimate).toBe(this.orderWithRelatedEstimate.RelatedEstimate);
        });

        
        test("should set the payment infomation fields", () => {
            expect(this.controllerResponse.PaymentMethodId).toBe(this.orderWithRelatedEstimate.PaymentMethodId);
            expect(this.controllerResponse.SH).toBe(this.orderWithRelatedEstimate.SH);
            expect(this.controllerResponse.SignifydID).toBe(this.orderWithRelatedEstimate.SignifydID);
            expect(this.controllerResponse.DiscountNames).toBe(this.orderWithRelatedEstimate.DiscountNames);
            expect(this.controllerResponse.CheckoutTypeId).toBe(this.orderWithRelatedEstimate.CheckoutTypeId);
            expect(this.controllerResponse.Taxable).toBeTruthy();
        });

        test("should set the general infomation fields", () => {
            expect(this.controllerResponse.BrontoId).toBe(this.orderWithRelatedEstimate.SiteOrderNumber);
            expect(this.controllerResponse.Email).toBe(this.orderWithRelatedEstimate.Email);
            expect(this.controllerResponse.Department).toBe(this.orderWithRelatedEstimate.Department);
            expect(this.controllerResponse.Note).toBe(this.orderWithRelatedEstimate.Note);
            expect(this.controllerResponse.BrontoId).toBe(this.orderWithRelatedEstimate.SiteOrderNumber);
        });

        test("should set the order infomation fields", () => {
            expect(this.controllerResponse.SiteOrderNumber).toBe(this.orderWithRelatedEstimate.SiteOrderNumber);
            expect(this.controllerResponse.SameDayShipping).toBe(this.orderWithRelatedEstimate.SameDayShipping);
            expect(this.controllerResponse.JobName).toBe(this.orderWithRelatedEstimate.JobName);
        });

        test("should set the website infomation fields", () => {
            expect(this.controllerResponse.Microsite).toBe(this.orderWithRelatedEstimate.Microsite);
            expect(this.controllerResponse.IPAddress).toBe(this.orderWithRelatedEstimate.IPAddress);
        });

        test("should set the billing address", () => {
            expect(this.controllerResponse.BillingAddressee).toBe(this.orderWithRelatedEstimate.BillingFirstName.concat(" "+this.orderWithRelatedEstimate.BillingLastName));
            expect(this.controllerResponse.BillingLine1).toBe(this.orderWithRelatedEstimate.BillingLine1);
            expect(this.controllerResponse.BillingLine2).toBe(this.orderWithRelatedEstimate.BillingLine2);
            expect(this.controllerResponse.BillingCity).toBe(this.orderWithRelatedEstimate.BillingCity);
            expect(this.controllerResponse.BillingState).toBe(this.orderWithRelatedEstimate.BillingState);
            expect(this.controllerResponse.BillingZip).toBe(this.orderWithRelatedEstimate.BillingZip);
        });

        test("should set the shipping address", () => {
            expect(this.controllerResponse.ShippingAddressee).toBe(this.orderWithRelatedEstimate.ShippingFirstName.concat(" "+this.orderWithRelatedEstimate.ShippingLastName));
            expect(this.controllerResponse.ShippingLine1).toBe(this.orderWithRelatedEstimate.ShippingLine1);
            expect(this.controllerResponse.ShippingLine2).toBe(this.orderWithRelatedEstimate.ShippingLine2);
            expect(this.controllerResponse.ShippingCity).toBe(this.orderWithRelatedEstimate.ShippingCity);
            expect(this.controllerResponse.ShippingState).toBe(this.orderWithRelatedEstimate.ShippingState);
            expect(this.controllerResponse.ShippingZip).toBe(this.orderWithRelatedEstimate.ShippingZip);
        });

        test("should set the item lines", () => {
            this.orderWithRelatedEstimate.Items.forEach(element => {
                var lineItemId = element.ItemId;
                var controllerResponseItem = this.controllerResponse.lineItemValues[lineItemId];
                var totalAmount = element.Quantity * element.Rate;
                
                expect(controllerResponseItem.quantity).toBe(element.Quantity);
                expect(controllerResponseItem.amount).toBe(totalAmount);
                expect(controllerResponseItem.rate).toBe(element.Rate);
            });
        });

        //Reset the Suitelet url to its original form
        afterAll(() => {
            websiteOrderImpoterSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1779&deploy=1&compid=634494_SB1&h=e2c8c227c3eb3b838b7a";
        });
    });



    // Should not create duplicate order

});