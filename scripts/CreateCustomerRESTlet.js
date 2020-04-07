/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'S/teamslog.js'],

function(record, search, teamsLog) {
	const teamsUrl = "https://outlook.office.com/webhook/ccaff0e4-631a-4421-b57a-c899e744d60f@3c2f8435-994c-4552-8fe8-2aec2d0822e4/IncomingWebhook/9627607123264385b536d2c1ff1dbd4b/f69cfaae-e768-453b-8323-13e5bcff563f";
	const d2c = "27";
	const homeOwner = "2";
	const avatax = "1990053";
	const nestProMicrositeId = 31;

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
				"ShippingZip",
				"Microsite"
            ];
			checkRequiredFields(requestBody, requiredFields);

            // Check if customer exists
			var getCustomerIdResponse = getCustomerId(requestBody);

			if(getCustomerIdResponse){
				var customerId = getCustomerIdResponse[0];
				var sameDayShipping = getCustomerIdResponse[1];
				
				// For existing Nest Pro customers, make sure the tax status matches the most current status in Big Commerce
				if(requestBody.Microsite == nestProMicrositeId){
					setTaxExemptionStatus(requestBody.Taxable, customerId);
				}

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
	
	
    function getCustomerId(requestBody){
		var searchFilters = createSearchFilters(requestBody);

		// Match on email
		var customerSearch = search.create({
			type: "customer",
			filters: searchFilters,
			columns:
			[
				search.createColumn({name: "internalid"}),
				search.createColumn({name: "custentity7", label: "Same Day Shipping"})
			]
		});

		// Get the first customer that matches
		var customerSearchResults = customerSearch.run().getRange(0, 1);
		
		if(!customerSearchResults || customerSearchResults.length == 0){
			log.audit("Customer does not exist");
			return false;
		}

		var customerId = customerSearchResults[0].getValue(customerSearch.columns[0]);
		var sameDayShipping = customerSearchResults[0].getValue(customerSearch.columns[1]);
		
		return [customerId, sameDayShipping];
	}


	function createSearchFilters(requestBody){
		var microsite = requestBody.Microsite;
		var searchFilters;

		// If order is from Nest Pro, match on Nest Pro ID instead of email
		if(microsite == nestProMicrositeId){
			var nestProId = requestBody.NestProId;
			
			searchFilters = 
			[
				["custentity_ss_nestproid","is", nestProId]
			];

		} else {
			// For all other orders, match on email and exclude any Google child accounts
			var customerEmail = requestBody.Email;

			searchFilters = 
			[
				["email", "is", customerEmail],
				"AND",
				["custentity_ss_nestproid","isempty",""]
			];
		}
		
		return searchFilters;
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
			
			// If shipping address exists and is not the same as billing address, create a new address subrecord
			if(requestBody.ShippingLine1 != requestBody.BillingLine1){
				setShippingAddress(customerRecord, requestBody);
			}

			var customerId = customerRecord.save().toString();

			return customerId;
            
        } catch(err){
			log.error("Error in createCustomerRecord ", err);
			throw err;
        }
	}


	function setCustomerFields(customerRecord, requestBody){
		try{
			requestBody.BillingName = requestBody.BillingFirstName + " " + requestBody.BillingLastName;

			var propertiesAndFieldIds = [
                // property, fieldId
				["Email", "email"],
				["Department", "custentity6"],
				["UserTypeId", "category"],
				["PhoneNumber", "phone"],
				["Company", "companyname"],
				["SameDayShipping", "custentity7"],
				["NestProId", "custentity_ss_nestproid"],
				["ParentAccountId", "parent"],
				["Taxable", "taxable"],
				["TaxVendor", "taxitem"],
				["IsPerson", "isperson"],
			];

			setCustomerName(requestBody, propertiesAndFieldIds);

			checkPropertyAndSetValues(customerRecord, requestBody, propertiesAndFieldIds);

			// Default 'Source Complete' and 'Fulfill Complete' for Google child accounts
			var googleParentId = 18054032; // production
			//var googleParentId = 17496702; // sandbox
			if(requestBody.hasOwnProperty("ParentAccountId") && requestBody.ParentAccountId == googleParentId){
				setSourcingFields(customerRecord, requestBody);
			}

			return;

		} catch(err){
			log.error("Error in setCustomerFields ", err);
			var message = {
				from: "Error in CreateCustomerRESTlet setCustomerFields",
				message: err.message,
				color: "yellow"
			}
        	teamsLog.log(message, teamsUrl);
		}
	}


	function setCustomerName(requestBody, propertiesAndFieldIds){
		// Nest Pro orders will have the customer name in different fields
		if(requestBody.Microsite == nestProMicrositeId){
			// Make sure name fields are not over the NetSuite character limit
			if(requestBody.hasOwnProperty("CustomerFirstName") && requestBody.CustomerFirstName.length > 32){
				requestBody.CustomerFirstName = requestBody.CustomerFirstName.slice(0, 32);
			}

			if(requestBody.hasOwnProperty("CustomerLastName") && requestBody.CustomerLastName.length > 32){
				requestBody.CustomerLastName = requestBody.CustomerLastName.slice(0, 32);
			}
			
			propertiesAndFieldIds.push(
				["CustomerFirstName", "firstname"],
				["CustomerLastName", "lastname"],
				["CustomerName", "altname"]
			);

		} else {
			// Make sure name fields are not over the NetSuite character limit
			if(requestBody.hasOwnProperty("BillingFirstName") && requestBody.BillingFirstName.length > 32){
				requestBody.BillingFirstName = requestBody.BillingFirstName.slice(0, 32);
			}

			if(requestBody.hasOwnProperty("BillingLastName") && requestBody.BillingLastName.length > 32){
				requestBody.BillingLastName = requestBody.BillingLastName.slice(0, 32);
			}
			
			propertiesAndFieldIds.push(
				["BillingFirstName", "firstname"],
				["BillingLastName", "lastname"],
				["BillingName", "altname"]
			);
		}
	}


	function setSourcingFields(customerRecord, requestBody) {
		try {
			var propertiesAndFieldIds = [
				// property, fieldId
				["SourceComplete", "custentity_ss_sourcecomplete"],
				["SourceKitsComplete", "custentity_ss_sourcekitscomplete"],
				["FulfillComplete", "custentity_ss_fulfillcomplete"],
			];
			checkPropertyAndSetValues(customerRecord, requestBody, propertiesAndFieldIds);

		} catch(err) {
			log.error("Error in setSourcingFields ", err);
			var message = {
				from: "Error in CreateCustomerRESTlet setSourcingFields",
				message: err.message,
				color: "yellow"
			}
        	teamsLog.log(message, teamsUrl);
		}
	}


	function setTaxExemptionStatus(bigCommerceTaxExemptionStatus, customerId){
		var taxExemptionStatusLookup = search.lookupFields({
			type: search.Type.CUSTOMER,
			id: customerId,
			columns: ['taxable']
		});

		var netsuiteTaxExemptionStatus = taxExemptionStatusLookup.taxable;

		if(netsuiteTaxExemptionStatus != bigCommerceTaxExemptionStatus){
			log.audit("updating tax values");
			var taxValues = {
				"taxable": bigCommerceTaxExemptionStatus
			}

			if(bigCommerceTaxExemptionStatus){
				taxValues["taxitem"] = avatax;

			} else {
				taxValues["taxitem"] = "";
			}
			
			record.submitFields({
				type: record.Type.CUSTOMER,
				id: customerId,
				values: taxValues
			});
		}

		return;
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
			
            if(typeof requestBody[requiredField] != "boolean" && (!requestBody.hasOwnProperty(requiredField) || !requestBody[requiredField] || requestBody[requiredField].length == 0)){
                throw new Error(requiredField + " is required");
            }
        }
    }
	

	function checkPropertyAndSetValues(customerRecord, requestObj, propertiesAndFieldIds){
		try {
			for(var i=0; i < propertiesAndFieldIds.length; i++){
				var property = propertiesAndFieldIds[i][0];
				var fieldId = propertiesAndFieldIds[i][1];
	
				if((requestObj.hasOwnProperty(property) && requestObj[property]) || typeof requestObj[property] == "boolean"){
					var value = requestObj[property];
	
				} else {
					// Sets the default value if one is not provided in the request
					var value = getDefaultValue(property);
				}
	
				try {
					customerRecord.setValue({ fieldId: fieldId, value: value });

				} catch (err) {
					log.error("Error in CreateCustomerRESTlet setting fieldId" + fieldId + " value " + value, err.message);
					var message = {
						from: "Error in CreateCustomerRESTlet setValue",
						message: "fieldId " + fieldId + " value " + value + "Error " + err.message,
						color: "yellow"
					}
					teamsLog.log(message, teamsUrl);
				}
			}
	
			return;

		} catch (err) {
			log.error("Error in checkPropertyAndSetValues", err);
			var message = {
				from: "Error in CreateCustomerRESTlet checkPropertyAndSetValues",
				message: err.message,
				color: "yellow"
			}
        	teamsLog.log(message, teamsUrl);
		}
	}


	function getDefaultValue(property){
		var defaultValue;

        switch (property) {
            case "Department":
                defaultValue = d2c;
				break;
			case "UserTypeId":
                defaultValue = homeOwner;
				break;
			case "Taxable":
				defaultValue = true;
				break;
			case "TaxVendor":
				defaultValue = avatax;
				break;
			case "IsPerson":
				defaultValue = "T";
				break;
            default:
                defaultValue = "";
                break;
        }

        return defaultValue;
    }
});