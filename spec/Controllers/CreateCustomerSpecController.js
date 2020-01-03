/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/https', 'S/helpers'],

function(record, https, helper) {
    // var createCustomerRESTletUrl = "https://634494.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=1762&deploy=1";
    var createCustomerRESTletUrl = "https://634494-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=1783&deploy=1";

    function onRequest(context) {
    	try{
            var jsonRequest = context.request.parameters.request;
            
            var functionType = context.request.parameters.functionType;
            var headers = {
                "Content-Type": "application/json",
                // "Authorization": "NLAuth nlauth_account=634494,nlauth_email=wildcat@hmwallace.com,nlauth_signature=March2015!,nlauth_role=1030"
                "Authorization": "NLAuth nlauth_account=634494_SB1,nlauth_email=wildcat@hmwallace.com,nlauth_signature=March2015!,nlauth_role=1030"
            }
            
            // Create new customer
            if(functionType == "create" || functionType == "existing"){
                var response = createCustomerRecord(jsonRequest, headers);
            }
            
        } catch(err) {            
			log.error('Error', err);
        	var response = {
                error: err.message
            }
			
        } finally {
            // Delete the item record if the request is from the 'CreateItemSuiteletSpec'
        	if(response.CustomerRecordId && functionType == "create"){
            	record.delete({
                    type: record.Type.CUSTOMER,
                    id: response.CustomerRecordId
                });
                log.audit("CustomerRecord deleted", response.customerId);
            }
        	log.audit("response", response);
            response = JSON.stringify(response);
            
        	context.response.write({
				output: response
			});
		}
    }

    return {
        onRequest: onRequest
    };
    
    function createCustomerRecord(jsonRequest, headers){
        try{
            var restletResponse = https.post({
                url: createCustomerRESTletUrl,
                body: jsonRequest,
                headers: headers
            });
            
            var parsedResponse = JSON.parse(restletResponse.body);
            log.debug("parsedResponse", parsedResponse);
            if(parsedResponse.hasOwnProperty("error")){
            	throw new Error(parsedResponse.error);
            }
            
            var customerRecordId = parsedResponse.customerId;
            log.audit("customerRecordId", customerRecordId);
            
            // Load the item record and get values
            var customerRecord = record.load({
                type: record.Type.CUSTOMER,
                id: customerRecordId,
                isDynamic: true
            });

            var fieldIdsArray = 
            [
                // Default fields
                ["taxable", "Taxable"],
                ["taxitem", "TaxItem"],
                ["isperson", "IsPerson"],
                ["custentity_ss_sourcecomplete", "SourceComplete"],
                ["custentity_ss_sourcekitscomplete", "SourceKitsComplete"],
                ["custentity_ss_fulfillcomplete", "FulfillComplete"],

                // General info
                ["email", "Email"],
                ["firstname", "CustomerFirstName"],
                ["lastname", "CustomerLastName"],
                ["altname", "AltName"],
                ["custentity6", "Department"],
                ["category", "UserTypeId"],
                ["phone", "PhoneNumber"],
                ["companyname", "Company"],

                // Billing Address
                ["billaddressee", "BillingAddressee"],
                ["billaddr1", "BillingLine1"],
                ["billaddr2", "BillingLine2"],
                ["billcity", "BillingCity"],
                ["billstate", "BillingState"],
                ["billzip", "BillingZip"],

                // Shipping Address
                ["shipaddressee", "ShippingAddressee"],
                ["shipaddr1", "ShippingLine1"],
                ["shipaddr2", "ShippingLine2"],
                ["shipcity", "ShippingCity"],
                ["shipstate", "ShippingState"],
                ["shipzip", "ShippingZip"],

                // Nest Pro fields
                ["custentity_ss_nestproid", "NestProId"],
                ["parent", "ParentAccountId"],
            ];
            
            var customerRecordValues = helper.getValues(customerRecord, fieldIdsArray);
            
            var response = {
                CustomerRecordId: customerRecordId,
                ParentAccountId: customerRecordValues.ParentAccountId,
                NestProId: customerRecordValues.NestProId,
                Taxable: customerRecordValues.Taxable,
                TaxItem: customerRecordValues.TaxItem,
                IsPerson: customerRecordValues.IsPerson,
                Email: customerRecordValues.Email,
                CustomerFirstName: customerRecordValues.CustomerFirstName,
                CustomerLastName: customerRecordValues.CustomerLastName,
                AltName: customerRecordValues.AltName,
                Department: customerRecordValues.Department,
                UserTypeId: customerRecordValues.UserTypeId,
                PhoneNumber: customerRecordValues.PhoneNumber,
                Company: customerRecordValues.Company,
                SameDayShipping: parsedResponse.sameDayShipping,
                BillingAddressee: customerRecordValues.BillingAddressee,
                BillingLine1: customerRecordValues.BillingLine1,
                BillingLine2: customerRecordValues.BillingLine2,
                BillingCity: customerRecordValues.BillingCity,
                BillingState: customerRecordValues.BillingState,
                BillingZip: customerRecordValues.BillingZip,
                SourceComplete: customerRecordValues.SourceComplete,
                SourceKitsComplete: customerRecordValues.SourceKitsComplete,
                FulfillComplete: customerRecordValues.FulfillComplete,
            }

            // Check for shipping address and get values
            jsonRequest = JSON.parse(jsonRequest);
            if(jsonRequest.hasOwnProperty("ShippingLine1") && jsonRequest.hasOwnProperty("BillingLine1") && jsonRequest.ShippingLine1 != null && jsonRequest.ShippingLine1 != "" && jsonRequest.ShippingLine1 != jsonRequest.BillingLine1){
                var shippingAddressValues = getShippingAddressFields(customerRecord);
                response.ShippingAddressee = shippingAddressValues.ShippingAddressee;
                response.ShippingLine1 = shippingAddressValues.ShippingLine1;
                response.ShippingLine2 = shippingAddressValues.ShippingLine2;
                response.ShippingCity = shippingAddressValues.ShippingCity;
                response.ShippingState = shippingAddressValues.ShippingState;
                response.ShippingZip = shippingAddressValues.ShippingZip;
            }
            
        } catch(err) {
			log.error('Error', err);
        	var response = {
                error: err.message
            }
        }

        return response;
    }

    function getShippingAddressFields(customerRecord){
        var shippingAddressValues = {};
        
        customerRecord.selectLine({ 
            sublistId: "addressbook",
            line: 1
        });

        var addressSubrecord = customerRecord.getCurrentSublistSubrecord({
            sublistId: "addressbook",
            fieldId: "addressbookaddress"
        });

        var fieldIdsArray = 
        [
            ["addressee", "ShippingAddressee"],
            ["addr1", "ShippingLine1"],
            ["addr2", "ShippingLine2"],
            ["city", "ShippingCity"],
            ["state", "ShippingState"],
            ["zip", "ShippingZip"],
        ];
        
        var shippingAddressValues = helper.getValues(addressSubrecord, fieldIdsArray);	

        return shippingAddressValues;
    }
    
});
