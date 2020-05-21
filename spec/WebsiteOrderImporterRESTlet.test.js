const httpRequest = require("./Helpers/HttpRequest");
const orderNumberGenerator = require("./Helpers/OrderNumberGenerator");
var websiteOrderImpoterSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1876&deploy=1&compid=634494_SB1&h=3190eaa83f6c6f75a2a0";
var websiteOrderImporterRESTletUrl = "https://634494-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=1761&deploy=1";
const headers = {
    "Content-Type": "application/json",
    "Authorization": "NLAuth nlauth_account=634494_SB1,nlauth_email=wildcat@hmwallace.com,nlauth_signature=March2015!,nlauth_role=1030"
}


describe("Import Orders From Supply.com", () => {

    describe("Create a new Sales Order without a Related Estimate", () => {
        beforeAll(() => {
            this.orderWithoutRelatedEstimate = {
                CustomerId: "18781607",
                SiteOrderNumber: orderNumberGenerator.generateOrderNumber(),
                Email: "BarryBlock@GeneCousineauActingStudio.com",
                BillingFirstName: "Barry",
                BillingLastName: "Block",
                Company: "Gene Cousineau Acting Studio",
                ShippingCompany: "Gene Cousineau Acting Studio",
                JobName: "Gene Cousineau's Acting Studio",
                Department: "29",
                BillingLine1: "311 Amber Lane",
                BillingLine2: "Apt B",
                BillingCity: "Ventura",
                BillingState: "CA",
                BillingZip: "90754",
                ShippingFirstName: "Gene",
                ShippingLastName: "Parmesan",
                ShippingLine1: "141 Tupelo Dr.",
                ShippingLine2: "Unit 605",
                ShippingCity: "Santa Monica",
                ShippingState: "CA",
                ShippingZip: "91578",
                ShippingCountry: "US",
                ShippingPhone: "2128744587",
                Note: "This is a test order",
                SH: 10,
                ShippingMethodName: "UPS Ground",
                DiscountNames: "Super Savings",
                IPAddress: "68.191.240.43",
                RelatedEstimate: null,
                SignifydID: "1154999499",
                Microsite: "31",
                CheckoutTypeId: "4",
                PaymentMethodId: "12",
                SameDayShipping: "3",
                Items: [
                    {
                        ItemId: "197145",
                        Quantity: 1,
                        Rate: 903.26,
                        Amount: 903.26,
                        DiscountNames: "Super Duper Saver",
                        OrderLevelDiscountAmount: 15,
                    },
                    {
                        ItemId: "1808976",
                        Quantity: 3,
                        Rate: 1506.45,
                        Amount: 4519.35,
                        DiscountNames: "Triple Saver",
                        OrderLevelDiscountAmount: 15,
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
            expect(this.controllerResponse.Taxable).toBe(true);
            expect(this.controllerResponse.TaxVendor).toBe("1990053");
        });

        test("should set the general infomation fields", () => {
            expect(this.controllerResponse.BrontoId).toBe(this.orderWithoutRelatedEstimate.SiteOrderNumber);
            expect(this.controllerResponse.Department).toBe(this.orderWithoutRelatedEstimate.Department);
            expect(this.controllerResponse.Note).toBe(this.orderWithoutRelatedEstimate.Note);
        });

        test("should set the order infomation fields", () => {
            expect(this.controllerResponse.SiteOrderNumber).toBe(this.orderWithoutRelatedEstimate.SiteOrderNumber);
            //expect(this.controllerResponse.SameDayShipping).toBe(this.orderWithoutRelatedEstimate.SameDayShipping);
            expect(this.controllerResponse.JobName).toBe(this.orderWithoutRelatedEstimate.JobName);
            expect(this.controllerResponse.ShippingMethodName).toBe("3");
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
            expect(this.controllerResponse.ShippingAttention).toBe(this.orderWithoutRelatedEstimate.Company);
            expect(this.controllerResponse.ShippingLine1).toBe(this.orderWithoutRelatedEstimate.ShippingLine1);
            expect(this.controllerResponse.ShippingLine2).toBe(this.orderWithoutRelatedEstimate.ShippingLine2);
            expect(this.controllerResponse.ShippingCity).toBe(this.orderWithoutRelatedEstimate.ShippingCity);
            expect(this.controllerResponse.ShippingState).toBe(this.orderWithoutRelatedEstimate.ShippingState);
            expect(this.controllerResponse.ShippingZip).toBe(this.orderWithoutRelatedEstimate.ShippingZip);
            expect(this.controllerResponse.ShippingPhone).toBe(this.orderWithoutRelatedEstimate.ShippingPhone);
        });

        test("should set the item lines", () => {
            expect(this.controllerResponse.Items.length).toBe(this.orderWithoutRelatedEstimate.Items.length);

            this.orderWithoutRelatedEstimate.Items.forEach(element => {
                var lineItemId = element.ItemId;
                
                this.controllerResponse.Items.forEach(netsuiteResponse => {
                    if(netsuiteResponse.itemId == lineItemId){
                        expect(netsuiteResponse.quantity).toBe(element.Quantity);
                        expect(netsuiteResponse.amount).toBe(element.Amount);
                        expect(netsuiteResponse.rate).toBe(element.Rate);
                        expect(netsuiteResponse.discountName).toBe(element.DiscountNames);
                        expect(netsuiteResponse.orderLevelDiscount).toBe(element.OrderLevelDiscountAmount);
                    }
                });
            });
        });

        // Reset the Suitelet url to its original form
        afterAll(() => {
            websiteOrderImpoterSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1876&deploy=1&compid=634494_SB1&h=3190eaa83f6c6f75a2a0";
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
                BillingLine1: "311 Amber Lane",
                BillingLine2: "Apt B",
                BillingCity: "Killen",
                BillingState: "TX",
                BillingZip: "75225",
                ShippingFirstName: "Gene",
                ShippingLastName: "Parmesan",
                ShippingLine1: "141 Tupelo Dr.",
                ShippingLine2: "",
                ShippingCity: "Austin",
                ShippingState: "TX",
                ShippingZip: "75225",
                ShippingCountry: "US",
                Note: "This is a test note",
                SH: 10,
                ShippingMethodName: "UPS Next Day Air Early A.M.",
                DiscountNames: "Super Savings",
                IPAddress: "99.203.23.226",
                SignifydID: "1129543835",
                AltOrderNumber: "61954029542",
                Microsite: "27",
                CheckoutTypeId: "4",
                PaymentMethodId: "1",
                SameDayShipping: "4", // This should be different than what is on the customer record
                Items: [
                    {
                        ItemId: "10268",
                        Quantity: 2,
                        Rate: 120.00,
                        Amount: 240.00,
                        PersonalItem: false
                    },
                    {
                        ItemId: "1808976",
                        Quantity: 3,
                        Rate: 1506.45,
                        Amount: 4519.35,
                        PersonalItem: true
                    }
                ]
            }
            
            // Create an Estimate and store the response as the RelatedEstimate
            websiteOrderImpoterSpecControllerUrl += "&functionType=createEstimate";
            websiteOrderImpoterSpecControllerUrl += "&sameDayShipping="+this.orderWithRelatedEstimate.SameDayShipping;
            this.orderWithRelatedEstimate.RelatedEstimate = httpRequest.get(websiteOrderImpoterSpecControllerUrl);;
            
            // Remove the function type from the url
            websiteOrderImpoterSpecControllerUrl = websiteOrderImpoterSpecControllerUrl.replace("&functionType=createEstimate", "");
            // Change the Same Day Shipping value to ensure that the Restlet sets it to the value that's on the related estimate
            this.orderWithRelatedEstimate.SameDayShipping = "1";

            // Create the Sales Order
            this.request = JSON.stringify(this.orderWithRelatedEstimate);
            
            this.restletResponse = httpRequest.post({
                url: websiteOrderImporterRESTletUrl,
                body: this.orderWithRelatedEstimate,
                headers: headers
            });

            // Reset the Same Day Shipping value back to its original state for testing purposes
            this.orderWithRelatedEstimate.SameDayShipping = "4";

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
            expect(this.controllerResponse.Taxable).toBe(true);
            expect(this.controllerResponse.TaxVendor).toBe("1990053");
        });

        test("should set the general infomation fields", () => {
            expect(this.controllerResponse.BrontoId).toBe(this.orderWithRelatedEstimate.SiteOrderNumber);
            expect(this.controllerResponse.Department).toBe(this.orderWithRelatedEstimate.Department);
            expect(this.controllerResponse.Note).toBe(this.orderWithRelatedEstimate.Note);
            expect(this.controllerResponse.BrontoId).toBe(this.orderWithRelatedEstimate.SiteOrderNumber);
        });

        test("should set the order infomation fields", () => {
            expect(this.controllerResponse.SiteOrderNumber).toBe(this.orderWithRelatedEstimate.SiteOrderNumber);
            expect(this.controllerResponse.SameDayShipping).toBe(this.orderWithRelatedEstimate.SameDayShipping);
            expect(this.controllerResponse.JobName).toBe(this.orderWithRelatedEstimate.JobName);
            expect(this.controllerResponse.ShippingMethodName).toBe("4234");
        });

        test("should set the website infomation fields", () => {
            expect(this.controllerResponse.Microsite).toBe(this.orderWithRelatedEstimate.Microsite);
            expect(this.controllerResponse.IPAddress).toBe(this.orderWithRelatedEstimate.IPAddress);
        });

        test("should set the billing address", () => {
            expect(this.controllerResponse.BillingAddressee).toBe(this.orderWithRelatedEstimate.BillingFirstName.concat(" "+this.orderWithRelatedEstimate.BillingLastName));
            //expect(this.controllerResponse.BillingLine1).toBe(this.orderWithRelatedEstimate.BillingLine1);
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
            expect(this.controllerResponse.Items.length).toBe(this.orderWithRelatedEstimate.Items.length);

            this.orderWithRelatedEstimate.Items.forEach(element => {
                var lineItemId = element.ItemId;
                
                this.controllerResponse.Items.forEach(netsuiteResponse => {
                    if(netsuiteResponse.itemId == lineItemId){
                        expect(netsuiteResponse.quantity).toBe(element.Quantity);
                        expect(netsuiteResponse.amount).toBe(element.Amount);
                        expect(netsuiteResponse.rate).toBe(element.Rate);
                        expect(netsuiteResponse.personalItem).toBe(element.PersonalItem);
                    }
                });
            });
        });

        // Reset the Suitelet url to its original form
        afterAll(() => {
            websiteOrderImpoterSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1876&deploy=1&compid=634494_SB1&h=3190eaa83f6c6f75a2a0";
        });
    });


    describe("Create a new Nest Pro Order", () => {
        beforeAll(() => {
            this.nestProOrder = {
                CustomerId: "17494445",
                SiteOrderNumber: orderNumberGenerator.generateOrderNumber(),
                Email: "BarryBlock@GeneCousineauActingStudio.com",
                BillingFirstName: "Barry",
                BillingLastName: "Block",
                Department: "29",
                BillingLine1: "311 Amber Lane",
                BillingLine2: "Apt B",
                BillingCity: "Killen",
                BillingState: "TX",
                BillingZip: "75225",
                ShippingFirstName: "Gene",
                ShippingLastName: "Parmesan",
                ShippingLine1: "141 Tupelo Dr.",
                ShippingLine2: "",
                ShippingCity: "Austin",
                ShippingState: "TX",
                ShippingZip: "75225",
                ShippingCountry: "US",
                ShippingMethodName: "UPS Next Day Air Early A.M.",
                IPAddress: "99.203.23.226",
                AltOrderNumber: orderNumberGenerator.generateOrderNumber(),
                Microsite: 31,
                CheckoutTypeId: "4",
                PaymentMethodId: "1",
                SameDayShipping: "4",
                Taxable: false,
                TaxVendor: " ",
                Items: [
                    {
                        ItemId: "10268",
                        Quantity: 2,
                        Rate: 120.00,
                        Amount: 240.00,
                        PersonalItem: false
                    }
                ]
            }
            
            // Send request to the WebsiteOrderImporterRESTlet
            this.restletResponse = httpRequest.post({
                url: websiteOrderImporterRESTletUrl,
                body: this.nestProOrder,
                headers: headers
            });
            // Store the sales order record id
            this.salesOrderRecordId = JSON.parse(this.restletResponse.body).salesOrderRecordId;
            websiteOrderImpoterSpecControllerUrl += "&functionType=create";
            websiteOrderImpoterSpecControllerUrl += "&salesOrderRecordId="+this.salesOrderRecordId;
        
            // Send to the controller to get the field values and store the response
            this.controllerResponse = httpRequest.get(websiteOrderImpoterSpecControllerUrl);
        });
        
        test("should set the not set the order as taxable", () => {
            expect(this.controllerResponse.Taxable).toBe(this.nestProOrder.Taxable);
        });

        // Reset the Suitelet url to its original form
        afterAll(() => {
            websiteOrderImpoterSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1876&deploy=1&compid=634494_SB1&h=3190eaa83f6c6f75a2a0";
        });
    });


    describe("Import orders with inactive items", () => {
        beforeAll(() => {
            this.orderWithInactiveItem = {
                CustomerId: "17494445",
                SiteOrderNumber: orderNumberGenerator.generateOrderNumber(),
                Email: "BarryBlock@GeneCousineauActingStudio.com",
                BillingFirstName: "Barry",
                BillingLastName: "Block",
                Department: "29",
                BillingLine1: "311 Amber Lane",
                BillingLine2: "Apt B",
                BillingCity: "Ventura",
                BillingState: "CA",
                BillingZip: "90754",
                ShippingFirstName: "Gene",
                ShippingLastName: "Parmesan",
                ShippingLine1: "141 Tupelo Dr.",
                ShippingLine2: "Unit 605",
                ShippingCity: "Santa Monica",
                ShippingState: "CA",
                ShippingZip: "91578",
                ShippingCountry: "US",
                SH: 10,
                ShippingMethodName: "UPS Ground",
                Microsite: "31",
                CheckoutTypeId: "4",
                PaymentMethodId: "12",
                SameDayShipping: "3",
                Items: [
                    {
                        ItemId: "39707",
                        isKit: false,
                        Quantity: 1,
                        Rate: 138,
                        Amount: 138,
                    },
                    {
                        ItemId: "745894",
                        isKit: true,
                        Quantity: 1,
                        Rate: 150,
                        Amount: 150,
                    }
                ]
            }

            var itemsJson = JSON.stringify(this.orderWithInactiveItem.Items);

            // Mark the item as inactive
            websiteOrderImpoterSpecControllerUrl += "&functionType=inactivateItems";
            websiteOrderImpoterSpecControllerUrl += "&items="+itemsJson;
            this.controllerResponse = httpRequest.get(websiteOrderImpoterSpecControllerUrl);

            // Import the order
            this.restletResponse = httpRequest.post({
                url: websiteOrderImporterRESTletUrl,
                body: this.orderWithInactiveItem,
                headers: headers
            });
            this.salesOrderRecordId = JSON.parse(this.restletResponse.body).salesOrderRecordId;

            // Send to the controller to get the field values and store the response
            websiteOrderImpoterSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1779&deploy=1&compid=634494_SB1&h=e2c8c227c3eb3b838b7a";
            websiteOrderImpoterSpecControllerUrl += "&functionType=create";
            websiteOrderImpoterSpecControllerUrl += "&salesOrderRecordId="+this.salesOrderRecordId;
            this.controllerResponse = httpRequest.get(websiteOrderImpoterSpecControllerUrl);
        });

        test("should create a new sales order record and return the sales order record id", () => {
            expect(this.salesOrderRecordId).not.toBeNull();
        });

        test("order should include the inactive item", () => {
            this.orderWithInactiveItem.Items.forEach(element => {
                var lineItemId = element.ItemId;
                
                this.controllerResponse.Items.forEach(netsuiteResponse => {
                    if(netsuiteResponse.itemId == lineItemId){
                        expect(netsuiteResponse.quantity).toBe(element.Quantity);
                        expect(netsuiteResponse.amount).toBe(element.Amount);
                        expect(netsuiteResponse.rate).toBe(element.Rate);
                    }
                });
            });
        });

        // Reset the Suitelet url to its original form
        afterAll(() => {
            websiteOrderImpoterSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1876&deploy=1&compid=634494_SB1&h=3190eaa83f6c6f75a2a0";
        });
    });


    describe("Throw exception if required field is missing", () => {
        beforeAll(() => {
            this.orderWithMissingFields = {
                CustomerId: ""
            }

            this.restletResponse = httpRequest.post({
                url: websiteOrderImporterRESTletUrl,
                body: this.orderWithMissingFields,
                headers: headers
            });

            this.netsuiteResponse = JSON.parse(this.restletResponse.body);
        });

        test("should throw exception", () => {
            expect(this.netsuiteResponse.error).toBe("CustomerId is required");
        });

        // Reset the Suitelet url to its original form
        afterAll(() => {
            websiteOrderImpoterSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1876&deploy=1&compid=634494_SB1&h=3190eaa83f6c6f75a2a0";
        });
    });


    describe("Tax Exempt States", () => {
        beforeAll(() => {
            this.taxExemptOrder = {
                CustomerId: 18781607,
                SiteOrderNumber: orderNumberGenerator.generateOrderNumber(),
                Email: "BarryBlock@GeneCousineauActingStudio.com",
                BillingFirstName: "Barry",
                BillingLastName: "Block",
                Company: "Gene Cousineau Acting Studio",
                ShippingCompany: "Gene Cousineau Acting Studio",
                JobName: "Gene Cousineau's Acting Studio",
                Department: "29",
                BillingLine1: "311 Amber Lane",
                BillingLine2: "Apt B",
                BillingCity: "Ventura",
                BillingState: "CA",
                BillingZip: "90754",
                ShippingFirstName: "Gene",
                ShippingLastName: "Parmesan",
                ShippingLine1: "141 Tupelo Dr.",
                ShippingLine2: "Unit 605",
                ShippingCity: "Santa Monica",
                ShippingState: "CA",
                ShippingZip: "91578",
                ShippingCountry: "US",
                ShippingPhone: "2128744587",
                Note: "This is a test order",
                SH: 9.99,
                ShippingMethodName: "Standard",
                IPAddress: "68.191.240.43",
                RelatedEstimate: null,
                SignifydID: "1154999499",
                Microsite: "31",
                CheckoutTypeId: "4",
                PaymentMethodId: "12",
                SameDayShipping: "3",
                Items: [
                    {
                        ItemId: "197145",
                        Quantity: 1,
                        Rate: 903.26,
                        Amount: 903.26,
                        DiscountNames: "Super Duper Saver",
                        OrderLevelDiscountAmount: 15,
                    },
                    {
                        ItemId: "1808976",
                        Quantity: 3,
                        Rate: 1506.45,
                        Amount: 4519.35,
                        DiscountNames: "Triple Saver",
                        OrderLevelDiscountAmount: 15,
                    }
                ]
            }
            
            this.request = JSON.stringify(this.taxExemptOrder);

            // Send request to the WebsiteOrderImporterRESTlet
            this.restletResponse = httpRequest.post({
                url: websiteOrderImporterRESTletUrl,
                body: this.taxExemptOrder,
                headers: headers
            });
            // Store the sales order record id
            this.salesOrderRecordId = JSON.parse(this.restletResponse.body).salesOrderRecordId;
            websiteOrderImpoterSpecControllerUrl += "&functionType=create";
            websiteOrderImpoterSpecControllerUrl += "&salesOrderRecordId="+this.salesOrderRecordId;
        
            // Send to the controller to get the field values and store the response
            this.controllerResponse = httpRequest.get(websiteOrderImpoterSpecControllerUrl);
        });


        test("should mark the order as tax exempt", () => {
            expect(this.controllerResponse.Taxable).toBe(false);
        });

        // Reset the Suitelet url to its original form
        afterAll(() => {
            websiteOrderImpoterSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1876&deploy=1&compid=634494_SB1&h=3190eaa83f6c6f75a2a0";
        });
    });

});