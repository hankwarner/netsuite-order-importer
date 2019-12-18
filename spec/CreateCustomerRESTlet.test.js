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
                ShippingZip: "30316",
                Microsite: 27
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
                ShippingZip: "91578",
                Microsite: 27
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


    describe("Nest Pro Customers", () => {
        this.customer = {
            NestProId: 99,
            Taxable: true,
            TaxVendor: "1990053",
            ParentAccountId: "17496702",
            Email: "mortysmith@rickandmorty.com",
            PhoneNumber: "6498076930",
            Department: "23",
            Company: "Adult Swim",
            BillingFirstName: "Morty",
            BillingLastName: "Smith",
            BillingLine1: "1990 Harry Herpson Rd",
            BillingLine2: "Apt C",
            BillingCity: "Atlanta",
            BillingState: "GA",
            BillingZip: "30312",
            ShippingFirstName: "Rick",
            ShippingLastName: "Sanchez",
            ShippingLine1: "7884 Wubba Lubba Dub-Dub Rd",
            ShippingLine2: "",
            ShippingCity: "Atlanta",
            ShippingState: "GA",
            ShippingZip: "30316",
            Microsite: "27",
            UserTypeId: "4",
            SameDayShipping: "3",
            SourceComplete: true,
            FulfillComplete: true,
            SourceKitsComplete: true,
        }

        test("should use the non-Google child account for non-Nest Pro orders", () => {
            this.request = JSON.stringify(this.customer);
            createCustomerSpecControllerUrl += "&request="+this.request;
            createCustomerSpecControllerUrl += "&functionType=existing";
        
            this.nonNestProCustomerResponse = httpRequest.get(createCustomerSpecControllerUrl);
            
            expect(this.nonNestProCustomerResponse.CustomerRecordId).toBe("17498104");

            createCustomerSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1786&deploy=1&compid=634494_SB1&h=4f268df624984b2c93a5";
        });

        test("should use the Google child account for Nest Pro orders", () => {
            this.customer.Microsite = 31;
            
            this.request = JSON.stringify(this.customer);
            createCustomerSpecControllerUrl += "&request="+this.request;
            createCustomerSpecControllerUrl += "&functionType=existing";
        
            this.nestProCustomerResponse = httpRequest.get(createCustomerSpecControllerUrl);
            
            expect(this.nestProCustomerResponse.CustomerRecordId).toBe("17497406");

            createCustomerSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1786&deploy=1&compid=634494_SB1&h=4f268df624984b2c93a5";
        });

        test("should create a new Nest Pro customer as a child account of Google", () => {
            this.customer.NestProId = "7777777";
            
            this.request = JSON.stringify(this.customer);
            createCustomerSpecControllerUrl += "&request="+this.request;
            createCustomerSpecControllerUrl += "&functionType=create";
        
            this.newNestProCustomerResponse = httpRequest.get(createCustomerSpecControllerUrl);
            
            expect(this.newNestProCustomerResponse.CustomerRecordId).not.toBeNull();
            expect(this.newNestProCustomerResponse.Taxable).toBe(this.customer.Taxable);
            expect(this.newNestProCustomerResponse.TaxItem).toBe(this.customer.TaxVendor);
            expect(this.newNestProCustomerResponse.IsPerson).toBe("T");
            expect(this.newNestProCustomerResponse.Email).toBe(this.customer.Email);
            expect(this.newNestProCustomerResponse.PhoneNumber).toBe(this.customer.PhoneNumber);
            expect(this.newNestProCustomerResponse.Company).toBe(this.customer.Company);
            expect(this.newNestProCustomerResponse.BillingFirstName).toBe(this.customer.BillingFirstName);
            expect(this.newNestProCustomerResponse.BillingLastName).toBe(this.customer.BillingLastName);
            expect(this.newNestProCustomerResponse.AltName).toBe(this.customer.BillingFirstName.concat(" "+this.customer.BillingLastName));
            expect(this.newNestProCustomerResponse.Department).toBe(this.customer.Department);
            expect(this.newNestProCustomerResponse.UserTypeId).toBe(this.customer.UserTypeId);
            expect(this.newNestProCustomerResponse.SameDayShipping).toBe(this.customer.SameDayShipping);
            expect(this.newNestProCustomerResponse.BillingAddressee).toBe(this.customer.BillingFirstName.concat(" "+this.customer.BillingLastName));
            expect(this.newNestProCustomerResponse.BillingLine1).toBe(this.customer.BillingLine1);
            expect(this.newNestProCustomerResponse.BillingLine2).toBe(this.customer.BillingLine2);
            expect(this.newNestProCustomerResponse.BillingCity).toBe(this.customer.BillingCity);
            expect(this.newNestProCustomerResponse.BillingState).toBe(this.customer.BillingState);
            expect(this.newNestProCustomerResponse.BillingZip).toBe(this.customer.BillingZip);
            expect(this.newNestProCustomerResponse.ShippingAddressee).toBe(this.customer.ShippingFirstName.concat(" "+this.customer.ShippingLastName));
            expect(this.newNestProCustomerResponse.ShippingLine1).toBe(this.customer.ShippingLine1);
            expect(this.newNestProCustomerResponse.ShippingLine2).toBe(this.customer.ShippingLine2);
            expect(this.newNestProCustomerResponse.ShippingCity).toBe(this.customer.ShippingCity);
            expect(this.newNestProCustomerResponse.ShippingState).toBe(this.customer.ShippingState);
            expect(this.newNestProCustomerResponse.ShippingZip).toBe(this.customer.ShippingZip);
            expect(this.newNestProCustomerResponse.NestProId).toBe(this.customer.NestProId);
            expect(this.newNestProCustomerResponse.ParentAccountId).toBe(this.customer.ParentAccountId);
            expect(this.newNestProCustomerResponse.SourceComplete).toBe(this.customer.SourceComplete);
            //expect(this.newNestProCustomerResponse.SourceKitsComplete).toBe(this.customer.SourceKitsComplete);
            expect(this.newNestProCustomerResponse.FulfillComplete).toBe(this.customer.FulfillComplete);

            createCustomerSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1786&deploy=1&compid=634494_SB1&h=4f268df624984b2c93a5";
        });

        test("should set customer as tax exempt", () => {
            this.customer.NestProId = 99;
            this.customer.Taxable = false;
            this.customer.TaxVendor = "";
            
            this.request = JSON.stringify(this.customer);
            createCustomerSpecControllerUrl += "&request="+this.request;
            createCustomerSpecControllerUrl += "&functionType=existing";
        
            this.taxExemptCustomerResponse = httpRequest.get(createCustomerSpecControllerUrl);
            
            expect(this.taxExemptCustomerResponse.Taxable).toBe(this.customer.Taxable);
            expect(this.taxExemptCustomerResponse.TaxItem).toBe(this.customer.TaxVendor);

            createCustomerSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1786&deploy=1&compid=634494_SB1&h=4f268df624984b2c93a5";
        });

        test("should set customer to not tax exempt", () => {
            this.customer.Taxable = true;
            this.customer.TaxVendor = "1990053";
            
            this.request = JSON.stringify(this.customer);
            createCustomerSpecControllerUrl += "&request="+this.request;
            createCustomerSpecControllerUrl += "&functionType=existing";
        
            this.nonTaxExemptCustomerResponse = httpRequest.get(createCustomerSpecControllerUrl);
            
            expect(this.nonTaxExemptCustomerResponse.Taxable).toBe(this.customer.Taxable);
            expect(this.nonTaxExemptCustomerResponse.TaxItem).toBe(this.customer.TaxVendor);

            createCustomerSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1786&deploy=1&compid=634494_SB1&h=4f268df624984b2c93a5";
        });

        // Reset the Suitelet url to its original form
        afterAll(() => {
            createCustomerSpecControllerUrl = "https://634494-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1786&deploy=1&compid=634494_SB1&h=4f268df624984b2c93a5";
        });
    });


    describe("Throw exception if required field is missing", () => {
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
