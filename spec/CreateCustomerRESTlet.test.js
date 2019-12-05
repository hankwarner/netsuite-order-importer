const httpRequest = require("./helpers/HttpRequest");
const faker = require('faker');
var createCustomerSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1786&deploy=1&compid=634494_SB1&h=4f268df624984b2c93a5";

describe("Create Customer", () => {

    describe("Create a New Customer Record", () => {
        beforeAll(() => {
            this.newCustomerToCreate = {
                Email: faker.internet.email(),
                BillingFirstName: faker.name.firstName(),
                BillingLastName: faker.name.lastName(),
                Department: "27",
                UserTypeId: "4",
                PhoneNumber: "6498076930",
                Company: "Initech",
                SameDayShipping: "3",
                BillingLine1: faker.address.streetAddress(),
                BillingLine2: "Room 104",
                BillingCity: faker.address.city(),
                BillingState: "GA",
                BillingZip: "30307",
                ShippingFirstName: faker.name.firstName(),
                ShippingLastName: faker.name.lastName(),
                ShippingLine1: faker.address.streetAddress(),
                ShippingLine2: "Unit 605",
                ShippingCity: faker.address.city(),
                ShippingState: "GA",
                ShippingZip: "30316"
            }
            
            this.request = JSON.stringify(this.newCustomerToCreate);
            createCustomerSpecControllerUrl += "&request="+this.request;
            createCustomerSpecControllerUrl += "&functionType=create";
        
            this.response = httpRequest.get(createCustomerSpecControllerUrl);
        });

        test("should create a new customer record and return the customer record id", () => {
            expect(this.response.CustomerRecordId).not.toBeNull();
        });

        test("should set the default fields", () => {
            expect(this.response.Taxable).toBe(true);
            expect(this.response.TaxItem).toBe("1990053"); // AVATAX
            expect(this.response.IsPerson).toBe("T");
        });

        test("should set the primary information fields", () => {
            expect(this.response.Email).toBe(this.newCustomerToCreate.Email);
            expect(this.response.PhoneNumber).toBe(this.newCustomerToCreate.PhoneNumber);
            expect(this.response.Company).toBe(this.newCustomerToCreate.Company);
            expect(this.response.BillingFirstName).toBe(this.newCustomerToCreate.BillingFirstName);
            expect(this.response.BillingLastName).toBe(this.newCustomerToCreate.BillingLastName);
            expect(this.response.AltName).toBe(this.newCustomerToCreate.BillingFirstName.concat(" "+this.newCustomerToCreate.BillingLastName));
            expect(this.response.Department).toBe(this.newCustomerToCreate.Department);
            expect(this.response.UserTypeId).toBe(this.newCustomerToCreate.UserTypeId);
            expect(this.response.SameDayShipping).toBe(this.newCustomerToCreate.SameDayShipping);
        });

        test("should set the billing address", () => {
            expect(this.response.BillingAddressee).toBe(this.newCustomerToCreate.BillingFirstName.concat(" "+this.newCustomerToCreate.BillingLastName));
            expect(this.response.BillingLine1).toBe(this.newCustomerToCreate.BillingLine1);
            expect(this.response.BillingLine2).toBe(this.newCustomerToCreate.BillingLine2);
            expect(this.response.BillingCity).toBe(this.newCustomerToCreate.BillingCity);
            expect(this.response.BillingState).toBe(this.newCustomerToCreate.BillingState);
            expect(this.response.BillingZip).toBe(this.newCustomerToCreate.BillingZip);
        });

        test("should set the shipping address", () => {
            expect(this.response.ShippingAddressee).toBe(this.newCustomerToCreate.ShippingFirstName.concat(" "+this.newCustomerToCreate.ShippingLastName));
            expect(this.response.ShippingLine1).toBe(this.newCustomerToCreate.ShippingLine1);
            expect(this.response.ShippingLine2).toBe(this.newCustomerToCreate.ShippingLine2);
            expect(this.response.ShippingCity).toBe(this.newCustomerToCreate.ShippingCity);
            expect(this.response.ShippingState).toBe(this.newCustomerToCreate.ShippingState);
            expect(this.response.ShippingZip).toBe(this.newCustomerToCreate.ShippingZip);
        });
        
        // Reset the Suitelet url to its original form
        afterAll(() => {
            createCustomerSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1786&deploy=1&compid=634494_SB1&h=4f268df624984b2c93a5";
        });
    });

    describe("Return values from existing customer record", () => {
        beforeAll(() => {
            this.newCustomerToCreate = {
                Email: "BarryBlock@CousineauActingStudio.com",
                BillingFirstName: "Barry",
                BillingLastName: "Block",
                Department: "29",
                UserTypeId: "4",
                PhoneNumber: "7064642574",
                Company: "Gene Cousineau's Acting Studio",
                SameDayShipping: "2",
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
                ShippingZip: "91578"
            }
            
            this.request = JSON.stringify(this.newCustomerToCreate);
            createCustomerSpecControllerUrl += "&request="+this.request;
            createCustomerSpecControllerUrl += "&functionType=existing";
        
            this.response = httpRequest.get(createCustomerSpecControllerUrl);
        });

        test("should return the customer record id of the existing customer", () => {
            expect(this.response.CustomerRecordId).toBe("17495600");
        });

        test("should set the default fields", () => {
            expect(this.response.Taxable).toBe(true);
            expect(this.response.TaxItem).toBe("1990053"); // AVATAX
            expect(this.response.IsPerson).toBe("T");
        });

        test("should set the primary information fields", () => {
            expect(this.response.Email).toBe(this.newCustomerToCreate.Email);
            expect(this.response.PhoneNumber).toBe(this.newCustomerToCreate.PhoneNumber);
            expect(this.response.Company).toBe(this.newCustomerToCreate.Company);
            expect(this.response.BillingFirstName).toBe(this.newCustomerToCreate.BillingFirstName);
            expect(this.response.BillingLastName).toBe(this.newCustomerToCreate.BillingLastName);
            expect(this.response.AltName).toBe(this.newCustomerToCreate.BillingFirstName.concat(" "+this.newCustomerToCreate.BillingLastName));
            expect(this.response.Department).toBe(this.newCustomerToCreate.Department);
            expect(this.response.UserTypeId).toBe(this.newCustomerToCreate.UserTypeId);
            expect(this.response.SameDayShipping).toBe(this.newCustomerToCreate.SameDayShipping);
        });

        test("should set the billing address", () => {
            expect(this.response.BillingAddressee).toBe(this.newCustomerToCreate.BillingFirstName.concat(" "+this.newCustomerToCreate.BillingLastName));
            expect(this.response.BillingLine1).toBe(this.newCustomerToCreate.BillingLine1);
            expect(this.response.BillingLine2).toBe(this.newCustomerToCreate.BillingLine2);
            expect(this.response.BillingCity).toBe(this.newCustomerToCreate.BillingCity);
            expect(this.response.BillingState).toBe(this.newCustomerToCreate.BillingState);
            expect(this.response.BillingZip).toBe(this.newCustomerToCreate.BillingZip);
        });

        test("should set the shipping address", () => {
            expect(this.response.ShippingAddressee).toBe(this.newCustomerToCreate.ShippingFirstName.concat(" "+this.newCustomerToCreate.ShippingLastName));
            expect(this.response.ShippingLine1).toBe(this.newCustomerToCreate.ShippingLine1);
            expect(this.response.ShippingLine2).toBe(this.newCustomerToCreate.ShippingLine2);
            expect(this.response.ShippingCity).toBe(this.newCustomerToCreate.ShippingCity);
            expect(this.response.ShippingState).toBe(this.newCustomerToCreate.ShippingState);
            expect(this.response.ShippingZip).toBe(this.newCustomerToCreate.ShippingZip);
        });
        
        // Reset the Suitelet url to its original form
        afterAll(() => {
            createCustomerSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1786&deploy=1&compid=634494_SB1&h=4f268df624984b2c93a5";
        });
    });


    describe("Throw exception if required field is midding", () => {
        this.customer = {
            Email: "BarryBlock@CousineauActingStudio.com",
            BillingFirstName: "Barry",
            BillingLastName: "Block",
            BillingLine1: "311 Amber Lane",
            BillingCity: "Ventura",
            BillingState: "CA",
            BillingZip: "90754",
        }

        test("should throw exception if email is missing", () => {
            // Remove email
            this.customer.Email = "";
            
            this.request = JSON.stringify(this.customer);
            createCustomerSpecControllerUrl += "&request="+this.request;
            createCustomerSpecControllerUrl += "&functionType=existing";
        
            this.response = httpRequest.get(createCustomerSpecControllerUrl);
            
            expect(this.response.error).toBe("Email is required");

            // Reset the url
            createCustomerSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1786&deploy=1&compid=634494_SB1&h=4f268df624984b2c93a5";
        });

        test("should throw exception if billing name is missing", () => {
            // Set email back and remove first name
            this.customer.Email = "BarryBlock@CousineauActingStudio.com";
            this.customer.BillingFirstName = "";
            
            this.request = JSON.stringify(this.customer);
            createCustomerSpecControllerUrl += "&request="+this.request;
            createCustomerSpecControllerUrl += "&functionType=existing";
        
            this.response = httpRequest.get(createCustomerSpecControllerUrl);
            
            expect(this.response.error).toBe("BillingFirstName is required");
        });

        // Reset the Suitelet url to its original form
        afterAll(() => {
            createCustomerSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1786&deploy=1&compid=634494_SB1&h=4f268df624984b2c93a5";
        });
    });
});
