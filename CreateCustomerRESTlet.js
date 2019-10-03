/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/record', 'N/search'],

function(email, record, search) {

    function doPost(requestBody) {
        try{
            log.audit("requestBody", requestBody);                    
            
            if (requestBody.email == null || requestBody.email == "") {
               throw new Error("Email is required");

            } else {
               var customerEmail = requestBody.email;
            }
           
            // Check if customer exists
			var getCustomerByEmailResponse = getCustomerByEmail(customerEmail);
           
            if(getCustomerByEmailResponse != false){
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
			
			response = JSON.stringify(response);

            return response;

        } catch(err){
			log.error("Error in doPost ", err);
			return err;
        }
    }

    return {
        post: doPost
    };
    
    function getCustomerByEmail(customerEmail){
		try{
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
				
				log.audit("Customer created");
				return [customerId, sameDayShipping];
			}

		} catch(err){
			log.error("Error in getCustomerByEmail ", err);
			throw err;
		}
    }
    
    function createCustomerRecord(requestBody){
        try{
            var customerRecord = record.create({ 
				type: record.Type.CUSTOMER,
				isDynamic: true
			});

			setCustomerFields(customerRecord, requestBody);

			setAddressFields(customerRecord, requestBody);
			
			var customerId = customerRecord.save();

			return customerId;
            
        } catch(err){
			log.error("Error in createCustomerRecord ", err);
			throw err;
        }
	}

	function setCustomerFields(customerRecord, requestBody){
		setFieldValue(customerRecord, "email", requestBody.email);
			
		// Always default taxable to true
		setFieldValue(customerRecord, "taxable", true);

		if(requestBody.BillingFirstName == null || requestBody.BillingFirstName == ""){
			throw new Error("BillingFirstName is required");

		} else {
			var customerName = requestBody.BillingFirstName;
			setFieldValue(customerRecord, "firstname", customerName);
			
			if(requestBody.BillingLastName != null && requestBody.BillingLastName != ""){
				setFieldValue(customerRecord, "lastname", requestBody.BillingLastName);
				customerName.concat(" " + requestBody.BillingLastName);
			}
			
			setFieldValue(customerRecord, "altname", customerName);
		}

		if(requestBody.Department == null || requestBody.Department == ""){
			// Default to D2C if department value is not passed
			setFieldValue(customerRecord, "custentity6", "27");

		} else {
			setFieldValue(customerRecord, "custentity6", requestBody.Department);
		}

		// Optional fields
		if(!requestBody.hasOwnProperty("Category")){
			// Default to Homeowner if value is not passed
			setFieldValue(customerRecord, "category", "2");

		} else {
			var customerCategory = requestBody.Category;
			setFieldValue(customerRecord, "category", customerCategory);
		}
		
		if(requestBody.SiteOrderNumber != null && requestBody.SiteOrderNumber != ""){
			var orderNumber = requestBody.SiteOrderNumber;
			var entityId = "CUST".concat(orderNumber);
			setFieldValue(customerRecord, "entityid", entityId);
		}

		if(requestBody.PhoneNumber != null && requestBody.PhoneNumber != ""){
			setFieldValue(customerRecord, "phone", requestBody.PhoneNumber);
		}

		if(requestBody.Company != null && requestBody.Company != ""){
			setFieldValue(customerRecord, "companyname", requestBody.Company);
		}

		if(requestBody.SameDayShipping != null && requestBody.SameDayShipping != ""){
			setFieldValue(customerRecord, "custentity7", requestBody.SameDayShipping);
		}
	}

	function setAddressFields(customerRecord, requestBody){
		customerRecord.selectNewLine({ 
			sublistId: "addressbook" 
		});
		var addressSubrecord = customerRecord.getCurrentSublistSubrecord({
			sublistId: "addressbook",
			fieldId: "addressbookaddress"
		});

		// Billing address fields
		setFieldValue(addressSubrecord, "addressee", customerName);
		
		if(requestBody.BillingLine1 != null && requestBody.BillingLine1 != ""){
			setFieldValue(addressSubrecord, "addr1", requestBody.BillingLine1);
		}

		if(requestBody.BillingLine2 != null && requestBody.BillingLine2 != ""){
			setFieldValue(addressSubrecord, "addr2", requestBody.BillingLine2);
		}
		
		if(requestBody.BillingCity != null && requestBody.BillingCity != ""){
			setFieldValue(addressSubrecord, "city", requestBody.BillingCity);
		}
		
		if(requestBody.BillingState != null && requestBody.BillingState != ""){
			setFieldValue(addressSubrecord, "state", requestBody.BillingState);
		}
		
		if(requestBody.BillingZip != null && requestBody.BillingZip != ""){
			setFieldValue(addressSubrecord, "zip", requestBody.BillingZip);
		}

		// If shipping address is null or the same as billing, set billing address as the shipping address
		if((requestBody.ShippingLine1 == null || requestBody.ShippingLine1 == "")  || (requestBody.ShippingLine1 == requestBody.BillingLine1)){
			setFieldValue(addressSubrecord, "defaultbilling", true);
			setFieldValue(addressSubrecord, "defaultshipping", true);

			customerRecord.commitLine({
				sublistId: "addressbook"
			});

		} else {
			setFieldValue(addressSubrecord, "defaultbilling", true);

			// Commit the previous line
			customerRecord.commitLine({
				sublistId: "addressbook"
			});

			// Create a new subrecord
			customerRecord.selectNewLine({ 
				sublistId: "addressbook" 
			});
			addressSubrecord = customerRecord.getCurrentSublistSubrecord({
				sublistId: "addressbook",
				fieldId: "addressbookaddress"
			});

			// Set Shipping Address fields
			setFieldValue(addressSubrecord, "addr1", requestBody.ShippingLine1);

			// If no shipping name is provided, use the billing name
			if(requestBody.ShippingFirstName == null || requestBody.ShippingFirstName == ""){
				setFieldValue(addressSubrecord, "addressee", customerName);

			} else {
				var shippingName = requestBody.ShippingFirstName;

				// Check if shipping last name exists
				if(requestBody.ShippingLastName != null && requestBody.ShippingLastName != ""){
					shippingName.concat(" " + requestBody.ShippingLastName);
				}

				setFieldValue(addressSubrecord, "addressee", shippingName);
			}

			if(requestBody.ShippingLine2 != null && requestBody.ShippingLine2 != ""){
				setFieldValue(addressSubrecord, "addr2", requestBody.ShippingLine2);
			}
			
			if(requestBody.ShippingCity != null && requestBody.ShippingCity != ""){
				setFieldValue(addressSubrecord, "city", requestBody.ShippingCity);
			}
			
			if(requestBody.ShippingState != null && requestBody.ShippingState != ""){
				setFieldValue(addressSubrecord, "state", requestBody.ShippingState);
			}
			
			if(requestBody.ShippingZip != null && requestBody.ShippingZip != ""){
				setFieldValue(addressSubrecord, "zip", requestBody.ShippingZip);
			}

			customerRecord.commitLine({
				sublistId: "addressbook"
			});
		}
	}
	
	function setFieldValue(record, fieldId, value){
		try{
			record.setValue({
				fieldId: fieldId,
				value: value
			});
	
			return;

		} catch(err){
			log.error("Error in setFieldValue ", err);
		}
	}
});
