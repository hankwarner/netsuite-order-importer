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
            
            if (!requestBody.hasOwnProperty("Email") || requestBody.Email == null || requestBody.Email == "") {
               throw new Error("Email is required");

            } else {
               var customerEmail = requestBody.Email;
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
				
				return [customerId, sameDayShipping];
			}

		} catch(err){
			log.error("Error in getCustomerByEmail ", err);
			throw err;
		}
    }
    
    function createCustomerRecord(requestBody){
    	log.audit("createCustomerRecord called");
    	try{
            var customerRecord = record.create({ 
				type: record.Type.CUSTOMER,
				isDynamic: true
			});

			var customerName = setCustomerFields(customerRecord, requestBody);

			setAddressFields(customerRecord, requestBody, customerName);

			var customerId = customerRecord.save().toString();

			return customerId;
            
        } catch(err){
			log.error("Error in createCustomerRecord ", err);
			throw err;
        }
	}

	function setCustomerFields(customerRecord, requestBody){
		try{
			setFieldValue(customerRecord, "email", requestBody.Email);

			// Always default taxable to true and taxitem to AVATAX
			setFieldValue(customerRecord, "taxable", true);
			setFieldValue(customerRecord, "taxitem", "1990053"); // AVATAX
			
			// Default isPerson to true
			setFieldValue(customerRecord, "isperson", "T");

			if(!requestBody.hasOwnProperty("BillingFirstName") || requestBody.BillingFirstName == null || requestBody.BillingFirstName == ""){
				throw new Error("BillingFirstName is required");

			} else {
				var customerName = requestBody.BillingFirstName;
				setFieldValue(customerRecord, "firstname", customerName);
				
				if(requestBody.hasOwnProperty("BillingLastName") && requestBody.BillingLastName != null && requestBody.BillingLastName != ""){
					setFieldValue(customerRecord, "lastname", requestBody.BillingLastName);
					customerName = customerName.concat(" " + requestBody.BillingLastName);

				} else {
					// If last name is not provided, NetSuite will throw an error on record save. So we use first name twice.
					setFieldValue(customerRecord, "lastname", requestBody.BillingFirstName);
				}
				
				setFieldValue(customerRecord, "altname", customerName);
			}

			if(!requestBody.hasOwnProperty("Department") || requestBody.Department == null || requestBody.Department == ""){
				// Default to D2C if department value is not passed
				setFieldValue(customerRecord, "custentity6", "27");

			} else {
				setFieldValue(customerRecord, "custentity6", requestBody.Department);
			}

			// Optional fields
			if(!requestBody.hasOwnProperty("UserTypeId") || requestBody.UserTypeId == null || requestBody.UserTypeId == ""){
				// Default to Homeowner if value is not passed
				setFieldValue(customerRecord, "category", "2");

			} else {
				setFieldValue(customerRecord, "category", requestBody.UserTypeId);
			}

			if(requestBody.hasOwnProperty("PhoneNumber") && requestBody.PhoneNumber != null && requestBody.PhoneNumber != ""){
				setFieldValue(customerRecord, "phone", requestBody.PhoneNumber);
			}

			if(requestBody.hasOwnProperty("Company") && requestBody.Company != null && requestBody.Company != ""){
				setFieldValue(customerRecord, "companyname", requestBody.Company);
			}

			if(requestBody.hasOwnProperty("SameDayShipping") && requestBody.SameDayShipping != null && requestBody.SameDayShipping != ""){
				setFieldValue(customerRecord, "custentity7", requestBody.SameDayShipping);
			}

			return customerName;

		} catch(err){
			log.error("Error in setCustomerFields ", err);

			// Fatal error
			if(err.message == "BillingFirstName is required"){
				throw err;
			}
		}
	}

	function setAddressFields(customerRecord, requestBody, customerName){
		try{
			customerRecord.selectNewLine({ 
				sublistId: "addressbook" 
			});
			var addressSubrecord = customerRecord.getCurrentSublistSubrecord({
				sublistId: "addressbook",
				fieldId: "addressbookaddress"
			});
	
			// Billing address fields
			setFieldValue(addressSubrecord, "addressee", customerName);
			
			if(requestBody.hasOwnProperty("BillingLine1") && requestBody.BillingLine1 != null && requestBody.BillingLine1 != ""){
				setFieldValue(addressSubrecord, "addr1", requestBody.BillingLine1);
			}
	
			if(requestBody.hasOwnProperty("BillingLine2") && requestBody.BillingLine2 != null && requestBody.BillingLine2 != ""){
				setFieldValue(addressSubrecord, "addr2", requestBody.BillingLine2);
			}
			
			if(requestBody.hasOwnProperty("BillingCity") && requestBody.BillingCity != null && requestBody.BillingCity != ""){
				setFieldValue(addressSubrecord, "city", requestBody.BillingCity);
			}
			
			if(requestBody.hasOwnProperty("BillingState") && requestBody.BillingState != null && requestBody.BillingState != ""){
				setFieldValue(addressSubrecord, "state", requestBody.BillingState);
			}
			
			if(requestBody.hasOwnProperty("BillingZip") && requestBody.BillingZip != null && requestBody.BillingZip != ""){
				setFieldValue(addressSubrecord, "zip", requestBody.BillingZip);
			}

			customerRecord.commitLine({
				sublistId: "addressbook"
			});
	
			// If shipping address exists and is not the same as billing address, create a new address subrecord
			if(requestBody.hasOwnProperty("ShippingLine1") && requestBody.hasOwnProperty("BillingLine1") && requestBody.ShippingLine1 != null && requestBody.ShippingLine1 != "" && requestBody.ShippingLine1 != requestBody.BillingLine1){
				createShippingAddress(customerRecord, requestBody, customerName);
			}	
	
			return;

		} catch(err) {
			log.error("Error in setAddressFields ", err);
		}
	}

	function createShippingAddress(customerRecord, requestBody, billingName){
		try {
			customerRecord.selectNewLine({
				sublistId: "addressbook" 
			});
			var addressSubrecord = customerRecord.getCurrentSublistSubrecord({
				sublistId: "addressbook",
				fieldId: "addressbookaddress"
			});
	
			// Set Shipping Address fields
			setFieldValue(addressSubrecord, "addr1", requestBody.ShippingLine1);
	
			// If no shipping name is provided, use the billing name
			if(!requestBody.hasOwnProperty("ShippingFirstName") || requestBody.ShippingFirstName == null || requestBody.ShippingFirstName == ""){
				setFieldValue(addressSubrecord, "addressee", billingName);
	
			} else {
				var shippingName = requestBody.ShippingFirstName;
	
				// Check if shipping last name exists
				if(requestBody.hasOwnProperty("ShippingLastName") && requestBody.ShippingLastName != null && requestBody.ShippingLastName != ""){
					shippingName = shippingName.concat(" " + requestBody.ShippingLastName);
				}
	
				setFieldValue(addressSubrecord, "addressee", shippingName);
			}
	
			if(requestBody.hasOwnProperty("ShippingLine2") && requestBody.ShippingLine2 != null && requestBody.ShippingLine2 != ""){
				setFieldValue(addressSubrecord, "addr2", requestBody.ShippingLine2);
			}
			
			if(requestBody.hasOwnProperty("ShippingCity") && requestBody.ShippingCity != null && requestBody.ShippingCity != ""){
				setFieldValue(addressSubrecord, "city", requestBody.ShippingCity);
			}
			
			if(requestBody.hasOwnProperty("ShippingState") && requestBody.ShippingState != null && requestBody.ShippingState != ""){
				setFieldValue(addressSubrecord, "state", requestBody.ShippingState);
			}
			
			if(requestBody.hasOwnProperty("ShippingZip") && requestBody.ShippingZip != null && requestBody.ShippingZip != ""){
				setFieldValue(addressSubrecord, "zip", requestBody.ShippingZip);
			}
	
			customerRecord.commitLine({
				sublistId: "addressbook"
			});
	
			return;

		} catch(err){
			log.error("Error in createShippingAddress ", err);
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
