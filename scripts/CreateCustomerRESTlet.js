/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'S/teamslog.js'],

function(record, search, teamsLog) {
	const teamsUrl = "https://outlook.office.com/webhook/ccaff0e4-631a-4421-b57a-c899e744d60f@3c2f8435-994c-4552-8fe8-2aec2d0822e4/IncomingWebhook/9627607123264385b536d2c1ff1dbd4b/f69cfaae-e768-453b-8323-13e5bcff563f";
	
    function doPost(requestBody) {
        try{
			log.audit("requestBody", requestBody);
			
			var requiredFields = [
				"Email",
				"BillingFirstName",
                "BillingLastName",
                "BillingLine1",
				"BillingZip",
				"ShippingFirstName",
                "ShippingLastName",
                "ShippingLine1",
                "ShippingZip"
            ];
			checkRequiredFields(requestBody, requiredFields);
			
			var customerEmail = requestBody.Email;

            // Check if customer exists
			var getCustomerByEmailResponse = getCustomerByEmail(customerEmail);
           
            if(getCustomerByEmailResponse){
				var customerId = getCustomerByEmailResponse[0];
				var sameDayShipping = getCustomerByEmailResponse[1];

			} else {
				var customerId = createCustomerRecord(requestBody);
				var sameDayShipping = requestBody.SameDayShipping;
			}

			log.audit("customerId", customerId);

            var response = {
			   customerId: customerId,
			   sameDayShipping: sameDayShipping
			};

        } catch(err){
			log.error("Error in CreateCustomerRESTlet doPost ", err);
			var message = {
				from: "Error in CreateCustomerRESTlet doPost",
				message: err.message,
				color: "red"
			}
        	teamsLog.log(message, teamsUrl);
			
			var response = {
            	error: err.message
            }
		}
		
		return response;
    }

    return {
        post: doPost
    };
	
	
    function getCustomerByEmail(customerEmail){
		// Match on email
		var customerSearchByEmail = search.create({
			type: "customer",
			filters:
			[
				["email","is",customerEmail]
			],
			columns:
			[
				search.createColumn({name: "internalid"}),
				search.createColumn({name: "custentity7", label: "Same Day Shipping"})
			]
		});

		// Get the first customer that matches
		var customerSearchByEmailResults = customerSearchByEmail.run().getRange(0, 1);

		if(!customerSearchByEmailResults || customerSearchByEmailResults.length == 0){
			log.audit("Customer does not exist");
			return false;

		} else {
			var customerId = customerSearchByEmailResults[0].getValue(customerSearchByEmail.columns[0]);
			var sameDayShipping = customerSearchByEmailResults[0].getValue(customerSearchByEmail.columns[1]);
			
			return [customerId, sameDayShipping];
		}
    }
	
	
    function createCustomerRecord(requestBody){
    	log.audit("createCustomerRecord called");
    	try{
            var customerRecord = record.create({ 
				type: record.Type.CUSTOMER,
				isDynamic: true
			});

			setCustomerFields(customerRecord, requestBody);
			setBillingAddress(customerRecord, requestBody);
			setShippingAddress(customerRecord, requestBody);

			var customerId = customerRecord.save().toString();

			return customerId;
            
        } catch(err){
			log.error("Error in createCustomerRecord ", err);
			throw err;
        }
	}


	function setCustomerFields(customerRecord, requestBody){
		try{
			// Always default taxable to true and taxitem to AVATAX
			var avatax = "1990053";
			var defaultTaxFields = [
				// fieldId, value
				["taxable", true],
				["taxitem", avatax],
				["isperson", "T"]
			];
			setFieldValues(customerRecord, defaultTaxFields);

			// Full name:
			requestBody.BillingName = requestBody.BillingFirstName + " " + requestBody.BillingLastName;
			
			var propertiesAndFieldIds = [
                // property, fieldId
				["Email", "email"],
				["BillingFirstName", "firstname"],
				["BillingLastName", "lastname"],
				["BillingName", "altname"],
				["Department", "custentity6"],
				["UserTypeId", "category"],
				["PhoneNumber", "phone"],
				["Company", "companyname"],
				["SameDayShipping", "custentity7"]
                
            ];
			checkPropertyAndSetValues(customerRecord, requestBody, propertiesAndFieldIds);

			return;

		} catch(err){
			log.error("Error in setCustomerFields ", err);

			// Fatal error
			if(err.message == "BillingFirstName is required"){
				throw err;
			}
		}
	}


	function setBillingAddress(customerRecord, requestBody){
		try{
			customerRecord.selectNewLine({ sublistId: "addressbook" });

			var billingAddressSubrecord = customerRecord.getCurrentSublistSubrecord({
				sublistId: "addressbook",
				fieldId: "addressbookaddress"
			});

			var billingAddressFields = [
                // property, fieldId
				["BillingName", "addressee"],
				["BillingLine1", "addr1"],
				["BillingLine2", "addr2"],
				["BillingCity", "city"],
				["BillingState", "state"],
				["BillingZip", "zip"]
			];
			checkPropertyAndSetValues(billingAddressSubrecord, requestBody, billingAddressFields);

			customerRecord.commitLine({ sublistId: "addressbook" });
	
			return;

		} catch(err) {
			log.error("Error in setAddressFields ", err);
			var message = {
				from: "Error in CreateCustomerRESTlet setAddressFields",
				message: err.message,
				color: "yellow"
			}
        	teamsLog.log(message, teamsUrl);
		}
	}


	function setShippingAddress(customerRecord, requestBody){
		try {
			customerRecord.selectNewLine({ sublistId: "addressbook" });

			var shippingAddressSubrecord = customerRecord.getCurrentSublistSubrecord({
				sublistId: "addressbook",
				fieldId: "addressbookaddress"
			});

			// Full shipping name:
			requestBody.ShippingName = requestBody.ShippingFirstName + " " + requestBody.ShippingLastName;

			var shippingAddressFields = [
                // property, fieldId
				["ShippingName", "addressee"],
				["ShippingLine1", "addr1"],
				["ShippingLine2", "addr2"],
				["ShippingCity", "city"],
				["ShippingState", "state"],
				["ShippingZip", "zip"]
			];
			checkPropertyAndSetValues(shippingAddressSubrecord, requestBody, shippingAddressFields);
	
			customerRecord.commitLine({ sublistId: "addressbook" });
	
			return;

		} catch(err){
			log.error("Error in createShippingAddress ", err);
			var message = {
				from: "Error in CreateCustomerRESTlet createShippingAddress",
				message: err.message,
				color: "yellow"
			}
        	teamsLog.log(message, teamsUrl);
		}
	}


	function checkRequiredFields(requestBody, requiredFields){
        for(var i=0; i < requiredFields.length; i++){
            var requiredField = requiredFields[i];
            if(!requestBody.hasOwnProperty(requiredField) || !requestBody[requiredField] || requestBody[requiredField].length == 0){
                throw new Error(requiredField + " is required");
            }
        }
    }
	

	function checkPropertyAndSetValues(customerRecord, requestObj, propertiesAndFieldIds){
        for(var i=0; i < propertiesAndFieldIds.length; i++){
            var property = propertiesAndFieldIds[i][0];
            var fieldId = propertiesAndFieldIds[i][1];

            if(requestObj.hasOwnProperty(property) && requestObj[property]){
                var value = requestObj[property];
                
            } else {
                // Sets the default value if one is not provided in the request
                var value = getDefaultValue(property);
            }
            
            customerRecord.setValue({ fieldId: fieldId, value: value });
        }

        return;
	}


	function setFieldValues(customerRecord, fieldIdAndValueArray){
        try {
            for(var i=0; i < fieldIdAndValueArray.length; i++){
                var fieldId = fieldIdAndValueArray[i][0];
                var value = fieldIdAndValueArray[i][1];
    
                customerRecord.setValue({
                    fieldId: fieldId,
                    value: value
                });
            }

            return;

        } catch (err) {
            var message = {
                from: "Error in setFieldValues",
                message: err.message,
                color: "yellow"
            }
            teamsLog.log(message, teamsUrl);
        }
    }


	function getDefaultValue(property){
		var defaultValue;
		const d2c = "27";
		const homeOwner = "2";

        switch (property) {
            case "Department":
                defaultValue = d2c;
				break;
			case "UserTypeId":
                defaultValue = homeOwner;
				break;
            default:
                defaultValue = "";
                break;
        }

        return defaultValue;
    }
});
