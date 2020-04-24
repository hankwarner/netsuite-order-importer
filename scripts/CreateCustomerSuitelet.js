/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/record', 'N/search', 'S/teamslog.js'], 
    
function(record, search, teamsLog) {
    const teamsUrl = "https://outlook.office.com/webhook/ccaff0e4-631a-4421-b57a-c899e744d60f@3c2f8435-994c-4552-8fe8-2aec2d0822e4/IncomingWebhook/f8f9709dfc234b4192a118c25fd96728/89f765ec-9688-47bc-b817-1e989e9a2767";
	const d2c = "27";
	const homeOwner = "2";
	const avatax = "1990053";
    const nestProMicrositeId = 31;
    var request;
    
    function onRequest(context) {
        try {
            request = JSON.parse(context.request.parameters.jsonRequest);
            log.audit("request", request);

            // Check if customer exists
			var getCustomerIdResponse = getCustomerId(request);

			if(getCustomerIdResponse){
				var customerId = getCustomerIdResponse[0];
				var sameDayShipping = getCustomerIdResponse[1];
				
				// For existing Nest Pro customers, make sure the tax status matches the most current status in Big Commerce
				if(request.Microsite == nestProMicrositeId){
					setTaxExemptionStatus(request.Taxable, customerId);
				}

			} else {
				var customerId = createCustomerRecord();
				var sameDayShipping = request.SameDayShipping;
			}

            log.audit("customerId", customerId);
            
            var response = customerId;

        } catch (err) {
            log.error("Error in CreateCustomerSuitelet ", err);
			var message = {
				from: "Error in CreateCustomerRESTlet",
				message: err.message,
				color: "red"
			}
        	teamsLog.log(message, teamsUrl);
			
			var response = err.message;
        }

        log.audit("Response", response);
            
        context.response.write({
            output: response
        });

    }

    return {
        onRequest: onRequest
    }


    function getCustomerId(){
		var searchFilters = createSearchFilters();

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


    function createSearchFilters(){
		var microsite = request.Microsite;
		var searchFilters;

		// If order is from Nest Pro, match on Nest Pro ID instead of email
		if(microsite == nestProMicrositeId){
			var nestProId = request.NestProId;
			
			searchFilters = 
			[
				["custentity_ss_nestproid","is", nestProId]
			];

		} else {
			// For all other orders, match on email and exclude any Google child accounts
			var customerEmail = request.Email;

			searchFilters = 
			[
				["email", "is", customerEmail],
				"AND",
				["custentity_ss_nestproid","isempty",""]
			];
		}
		
		return searchFilters;
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
    

    function createCustomerRecord(){
    	log.audit("createCustomerRecord called");
    	try{
            var customerRecord = record.create({ 
				type: record.Type.CUSTOMER,
				isDynamic: true
			});

			setCustomerFields(customerRecord);

			if(request.BillingLine1){
				setBillingAddress(customerRecord);
			}
			
			// If shipping address exists and is not the same as billing address, create a new address subrecord
			if(request.ShippingLine1 && request.ShippingLine1 != request.BillingLine1){
				setShippingAddress(customerRecord);
			}

			var customerId = customerRecord.save().toString();

			return customerId;
            
        } catch(err){
			log.error("Error in createCustomerRecord ", err);
			throw err;
        }
    }
    

    function setCustomerFields(customerRecord){
		try{
			request.BillingName = request.BillingFirstName + " " + request.BillingLastName;

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
				["SalesRep", "salesrep"],
				["NotAPro", "custentity191"]
			];

			setCustomerName(propertiesAndFieldIds);

			checkPropertyAndSetValues(customerRecord, propertiesAndFieldIds);

			// Default 'Source Complete' and 'Fulfill Complete' for Google child accounts
			var googleParentId = 18054032; // production
			//var googleParentId = 17496702; // sandbox
			if(request.hasOwnProperty("ParentAccountId") && request.ParentAccountId == googleParentId){
				setSourcingFields(customerRecord, request);
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


    function setCustomerName(propertiesAndFieldIds){
		// Nest Pro orders will have the customer name in different fields
		if(request.Microsite == nestProMicrositeId){
			// Make sure name fields are not over the NetSuite character limit
			if(request.hasOwnProperty("CustomerFirstName") && request.CustomerFirstName.length > 32){
				request.CustomerFirstName = request.CustomerFirstName.slice(0, 32);
			}

			if(request.hasOwnProperty("CustomerLastName") && request.CustomerLastName.length > 32){
				request.CustomerLastName = request.CustomerLastName.slice(0, 32);
			}
			
			propertiesAndFieldIds.push(
				["CustomerFirstName", "firstname"],
				["CustomerLastName", "lastname"],
				["CustomerName", "altname"]
			);

		} else {
			// Make sure name fields are not over the NetSuite character limit
			if(request.hasOwnProperty("BillingFirstName") && request.BillingFirstName.length > 32){
				request.BillingFirstName = request.BillingFirstName.slice(0, 32);
			}

			if(request.hasOwnProperty("BillingLastName") && request.BillingLastName.length > 32){
				request.BillingLastName = request.BillingLastName.slice(0, 32);
			}
			
			propertiesAndFieldIds.push(
				["BillingFirstName", "firstname"],
				["BillingLastName", "lastname"],
				["BillingName", "altname"]
			);
		}
	}
    

    function setBillingAddress(customerRecord){
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
			checkPropertyAndSetValues(billingAddressSubrecord, billingAddressFields);

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


	function setShippingAddress(customerRecord){
		try {
			customerRecord.selectNewLine({ sublistId: "addressbook" });

			var shippingAddressSubrecord = customerRecord.getCurrentSublistSubrecord({
				sublistId: "addressbook",
				fieldId: "addressbookaddress"
			});

			// Full shipping name:
			request.ShippingName = request.ShippingFirstName + " " + request.ShippingLastName;

			var shippingAddressFields = [
                // property, fieldId
				["ShippingName", "addressee"],
				["ShippingLine1", "addr1"],
				["ShippingLine2", "addr2"],
				["ShippingCity", "city"],
				["ShippingState", "state"],
				["ShippingZip", "zip"]
			];
			checkPropertyAndSetValues(shippingAddressSubrecord, shippingAddressFields);
	
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
    

    function checkPropertyAndSetValues(customerRecord, propertiesAndFieldIds){
		try {
			for(var i=0; i < propertiesAndFieldIds.length; i++){
				var property = propertiesAndFieldIds[i][0];
				var fieldId = propertiesAndFieldIds[i][1];
	
				if((request.hasOwnProperty(property) && request[property]) || typeof request[property] == "boolean"){
					var value = request[property];
	
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
