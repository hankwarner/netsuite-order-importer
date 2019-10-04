/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/record', 'N/search', 'S/accounting'],

function(email, record, search, accounting) {

    function doPost(requestBody) {
        try{
            log.audit("requestBody", requestBody);
        
            if(!requestBody.hasOwnProperty("CustomerId") || requestBody.CustomerId == null || requestBody.CustomerId == ""){
                throw new Error("CustomerId is required");

            } else if(!requestBody.hasOwnProperty("Items") || requestBody.Items == null || requestBody.Items == []){
                throw new Error("Items array is required");
            }

            var customerId = requestBody.CustomerId;

            var items = requestBody.Items;
            // Adds a flag called "existing" and sets all items to false
            items = buildItemObject(items);

            /* If there is a related estimate, transform the estimate record. 
            *  Else create a new sales order record.
            */
            if(requestBody.hasOwnProperty("RelatedEstimate") && requestBody.RelatedEstimate != null && requestBody.RelatedEstimate != ""){
            	log.audit("has related estimate", requestBody.RelatedEstimate);
            	var salesOrderRecord = record.transform({
                    fromType: record.Type.ESTIMATE,
		            fromId: requestBody.RelatedEstimate,
		            toType: record.Type.SALES_ORDER,
                    isDynamic: true
                });
                
                setFieldValue(salesOrderRecord, "custbody261", requestBody.RelatedEstimate);
                setFieldValue(salesOrderRecord, "entity", customerId);

                // Set the "existing" flag to true for items that were already on the estimate record
                items = checkItemsOnRelatedEstimate(salesOrderRecord, items);

            } else {
            	log.audit("does not have related estimate");
            	var salesOrderRecord = record.create({
                    type: record.Type.SALES_ORDER,
                    isDynamic: true,  
                    defaultValues: {
                        entity: customerId
                    }
                });
            }
            
            var salesOrderRecordId = setSalesOrderValues(salesOrderRecord, requestBody, items);
            log.audit("salesOrderRecordId", salesOrderRecordId);
            
            var response = {
            	salesOrderRecordId: salesOrderRecordId
            }
            
            return response;

        } catch(err){
            // Email Suitesquad and/or log to Teams
            return err;
        }
    }

    return {
        post: doPost
    };

    function buildItemObject(items){
        try{
            for (var index in items) {
                items[index].existing = false;
            }
            log.audit("buildItemObject result", items);
            return items;

        } catch(err){
            log.error("Error in buildItemObject ", err);
            throw err;
        }
    };

    function checkItemsOnRelatedEstimate(salesOrderRecord, items) {
        var itemCount = salesOrderRecord.getLineCount('item');
        
        for (var i = 0; i < itemCount; i++) {
            var itemId = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            var quantity = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });

            for (var index in items) {
                var item = items[index];
                if (!item.existing && item.ItemId == itemId && item.Quantity == quantity) {
                    items[index].existing = true;
                }
            }
        }

        return items;
    }

    function setSalesOrderValues(salesOrderRecord, requestBody, items){
        try {
            // Default taxable to true
        	setFieldValue(salesOrderRecord, "istaxable", true);
        	
        	// Set tax rate
            var taxRate = getTaxRate(requestBody);
            setFieldValue(salesOrderRecord, "taxrate", taxRate);
        	
        	if(!requestBody.hasOwnProperty("PaymentMethodId") || requestBody.PaymentMethodId == null || requestBody.PaymentMethodId == ""){
            	// Set to Cash if payment method is not provided
            	setFieldValue(salesOrderRecord, "paymentmethod", "1");
            } else {
                setFieldValue(salesOrderRecord, "paymentmethod", requestBody.PaymentMethodId);
            }

            if(requestBody.hasOwnProperty("SH") && requestBody.SH != null && requestBody.SH != ""){
                setFieldValue(salesOrderRecord, "shippingcost", requestBody.SH);
            }
            
            if(requestBody.hasOwnProperty("Department") && requestBody.Department != null && requestBody.Department != ""){
                setFieldValue(salesOrderRecord, "department", requestBody.Department);
            }
            
            if(requestBody.hasOwnProperty("Email") && requestBody.Email != null && requestBody.Email != ""){
                setFieldValue(salesOrderRecord, "custbody1", requestBody.Email);
            }
            
            if(requestBody.hasOwnProperty("SignifydID") && requestBody.SignifydID != null && requestBody.SignifydID != ""){
                setFieldValue(salesOrderRecord, "custbody277", requestBody.SignifydID);
            }

            if(requestBody.hasOwnProperty("SiteOrderNumber") && requestBody.SiteOrderNumber != null && requestBody.SiteOrderNumber != ""){
                setFieldValue(salesOrderRecord, "otherrefnum", requestBody.SiteOrderNumber);
                setFieldValue(salesOrderRecord, "custbody_ss_brontoid", requestBody.SiteOrderNumber);
            }
            
            if(requestBody.hasOwnProperty("JobName") && requestBody.JobName != null && requestBody.JobName != ""){
                setFieldValue(salesOrderRecord, "custbody61", requestBody.JobName);
            }
            
            if(requestBody.hasOwnProperty("DiscountNames") && requestBody.DiscountNames != null && requestBody.DiscountNames != ""){
                setFieldValue(salesOrderRecord, "custbody209", requestBody.DiscountNames);
            }
            
            if(requestBody.hasOwnProperty("AltOrderNumber") && requestBody.AltOrderNumber != null && requestBody.AltOrderNumber != ""){
                setFieldValue(salesOrderRecord, "custbody270", requestBody.AltOrderNumber);
            }
            
            if(!requestBody.hasOwnProperty("CheckoutTypeId") || requestBody.CheckoutTypeId == null || requestBody.CheckoutTypeId == ""){
                // Default to Anonymous
            	setFieldValue(salesOrderRecord, "custbody40", "1");
            } else {
            	setFieldValue(salesOrderRecord, "custbody40", requestBody.CheckoutTypeId);
            }
            
            if(!requestBody.hasOwnProperty("UserTypeId") || requestBody.UserTypeId == null || requestBody.UserTypeId == ""){
                // Default to Homeowner
            	setFieldValue(salesOrderRecord, "custbody40", "2");
            } else {
            	setFieldValue(salesOrderRecord, "custbody40", requestBody.UserTypeId);
            }

            if(requestBody.hasOwnProperty("DateCreated") && requestBody.DateCreated != null && requestBody.DateCreated != ""){
            	var salesOrderDate = formatDate(requestBody.DateCreated);
                setFieldValue(salesOrderRecord, "trandate", salesOrderDate);
            }

            // Set memo to PaymentMethodName + Note
            var memo = "";
            if(requestBody.hasOwnProperty("PaymentMethodName") && requestBody.PaymentMethodName != null && requestBody.PaymentMethodName != ""){
                memo = requestBody.PaymentMethodName;
            }
            if(requestBody.hasOwnProperty("Note") && requestBody.Note != null && requestBody.Note != ""){
            	memo = memo.concat(" - " + requestBody.Note);
            }
            if(memo != ""){
            	setFieldValue(salesOrderRecord, "memo", memo);
            }

            if(requestBody.hasOwnProperty("Microsite") && requestBody.Microsite != null && requestBody.Microsite != ""){
                setFieldValue(salesOrderRecord, "custbody242", requestBody.Microsite);
            }
            
            if(requestBody.hasOwnProperty("IPAddress") && requestBody.IPAddress != null && requestBody.IPAddress != ""){
                setFieldValue(salesOrderRecord, "custbody267", requestBody.IPAddress);
            }

            // Shipping values
            if(!requestBody.hasOwnProperty("SameDayShipping") || requestBody.SameDayShipping == null || requestBody.SameDayShipping == ""){
            	// Default to No-Fully Committed Only if not provided
            	setFieldValue(salesOrderRecord, "custbody7", "3");
            } else {
            	setFieldValue(salesOrderRecord, "custbody7", requestBody.SameDayShipping);
            }

            if(requestBody.hasOwnProperty("ShippingMethodName") && requestBody.ShippingMethodName != null && requestBody.ShippingMethodName != ""){
                var shippingMethodName = requestBody.ShippingMethodName;
                var shippingCarrier;

                if(shippingMethodName.toLowerCase().indexOf("ups") != -1){
                    shippingCarrier = "ups";
                } else {
                    shippingCarrier = "nonups";
                }

                setFieldValue(salesOrderRecord, "shipcarrier", shippingCarrier);

                var shippingMethodId = mapShippingValues(shippingMethodName);
                setFieldValue(salesOrderRecord, "shipmethod", shippingMethodId);
            }

            // Set Addresses
            if(requestBody.hasOwnProperty("BillingLine1") && requestBody.BillingLine1 != null && requestBody.BillingLine1 != ""){
                var customerBillingName = setBillingAddress(salesOrderRecord, requestBody);

                // Check if a different Shipping Address was provided. If so, set the shipping address (else it will auto-set to the billing address)
                if(requestBody.hasOwnProperty("ShippingLine1") && requestBody.ShippingLine1 != null && requestBody.ShippingLine1 != "" && requestBody.ShippingLine1 != requestBody.BillingLine1){
                    setShippingAddress(salesOrderRecord, requestBody, customerBillingName);
                }
            }

            // Add line items
            for (var index in items) {
                log.debug("items", items);
                log.debug("index", index);
            	var lineItem = items[index];
            	log.debug("lineItem", lineItem);

                if(lineItem.existing){
                    continue;
                }

                salesOrderRecord.selectNewLine({
                    sublistId: 'item'
                });

                salesOrderRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: lineItem.ItemId
                });

                salesOrderRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: lineItem.Quantity
                });

                // Set Price Level to Custom
                salesOrderRecord.setCurrentSublistValue({
                    sublistId: 'item', 
                    fieldId: 'price', 
                    value: "-1"
                });

                salesOrderRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    value: lineItem.Rate
                });
                
                salesOrderRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    value: lineItem.Amount
                });

                try{
                    if(lineItem.hasOwnProperty("ItemNotes") && lineItem.ItemNotes != null && lineItem.ItemNotes != ""){
                        salesOrderRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol19',
                            value: lineItem.ItemNotes
                        });
                    }
    
    
                    if(lineItem.hasOwnProperty("DiscountNames") && lineItem.DiscountNames != null && lineItem.DiscountNames != ""){
                        salesOrderRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol34',
                            value: lineItem.DiscountNames
                        });
                    }

                    if(lineItem.hasOwnProperty("OrderLevelDiscountAmount") && lineItem.OrderLevelDiscountAmount != null && lineItem.OrderLevelDiscountAmount != ""){
                        salesOrderRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol35',
                            value: lineItem.OrderLevelDiscountAmount
                        });
                    }

                } catch(err){
                    log.error("Error in setSalesOrderValues when setting item notes and discounts", err);
                }
                
                salesOrderRecord.commitLine({
                    sublistId: 'item'
                });
            }
            
            var salesOrderRecordId = salesOrderRecord.save();
            log.debug("salesOrderRecordId", salesOrderRecordId);
            
            return salesOrderRecordId;

        } catch(err) {
            log.error("Error in setSalesOrderValues", err);
            throw err;
        }
    }
    
    function getTaxRate(requestBody){
    	try {
    		var taxTotal = Number(requestBody.TaxTotal);
        	var total = Number(requestBody.Total);
        	log.debug("taxTotal", taxTotal);
        	log.debug("total", total);
        	
        	var taxRate = accounting.toFixed(taxTotal / ((total - taxTotal) * 100), 2);
        	log.debug("before toFixed", (taxTotal / ((total - taxTotal) * 100)));
        	log.debug("taxRate", taxRate);
        	
        	return taxRate;
        	
    	} catch(err){
    		log.error("Error in getTaxRate", err);
    	}
    }

    function setBillingAddress(salesOrderRecord, requestBody){
		try{
			var billingAddressSubRecord = salesOrderRecord.getSubrecord({ fieldId: 'billingaddress' });
            var customerBillingName;

            if(requestBody.hasOwnProperty("BillingFirstName") && requestBody.BillingFirstName != null || requestBody.BillingFirstName != ""){
				customerBillingName = requestBody.BillingFirstName;
			}
            
            if(requestBody.hasOwnProperty("BillingLastName") && requestBody.BillingLastName != null && requestBody.BillingLastName != ""){
                customerBillingName = customerBillingName.concat(" " + requestBody.BillingLastName);
            }
	
			setFieldValue(billingAddressSubRecord, "addressee", customerBillingName);
			
			if(requestBody.hasOwnProperty("BillingLine1") && requestBody.BillingLine1 != null && requestBody.BillingLine1 != ""){
				setFieldValue(billingAddressSubRecord, "addr1", requestBody.BillingLine1);
			}
	
			if(requestBody.hasOwnProperty("BillingLine2") && requestBody.BillingLine2 != null && requestBody.BillingLine2 != ""){
				setFieldValue(billingAddressSubRecord, "addr2", requestBody.BillingLine2);
			}
			
			if(requestBody.hasOwnProperty("BillingCity") && requestBody.BillingCity != null && requestBody.BillingCity != ""){
				setFieldValue(billingAddressSubRecord, "city", requestBody.BillingCity);
			}
			
			if(requestBody.hasOwnProperty("BillingState") && requestBody.BillingState != null && requestBody.BillingState != ""){
				setFieldValue(billingAddressSubRecord, "state", requestBody.BillingState);
			}
			
			if(requestBody.hasOwnProperty("BillingZip") && requestBody.BillingZip != null && requestBody.BillingZip != ""){
				setFieldValue(billingAddressSubRecord, "zip", requestBody.BillingZip);
			}
	
			return customerBillingName;

		} catch(err) {
			log.error("Error in setBillingAddress", err);
		}
	}

	function setShippingAddress(salesOrderRecord, requestBody, customerBillingName){
		try {
			var shippingAddressSubRecord = salesOrderRecord.getSubrecord({ fieldId: 'shippingaddress' });
	
			setFieldValue(shippingAddressSubRecord, "addr1", requestBody.ShippingLine1);
    
            // If shipping name was not provided, use the billing name
			if(!requestBody.hasOwnProperty("ShippingFirstName") || requestBody.ShippingFirstName == null || requestBody.ShippingFirstName == ""){
				setFieldValue(shippingAddressSubRecord, "addressee", customerBillingName);
	
			} else {
				var customerShippingName = requestBody.ShippingFirstName;
	
				if(requestBody.hasOwnProperty("ShippingLastName") && requestBody.ShippingLastName != null && requestBody.ShippingLastName != ""){
					customerShippingName = customerShippingName.concat(" " + requestBody.ShippingLastName);
				}
	
				setFieldValue(shippingAddressSubRecord, "addressee", customerShippingName);
			}
	
			if(requestBody.hasOwnProperty("ShippingLine2") && requestBody.ShippingLine2 != null && requestBody.ShippingLine2 != ""){
				setFieldValue(shippingAddressSubRecord, "addr2", requestBody.ShippingLine2);
			}
			
			if(requestBody.hasOwnProperty("ShippingCity") && requestBody.ShippingCity != null && requestBody.ShippingCity != ""){
				setFieldValue(shippingAddressSubRecord, "city", requestBody.ShippingCity);
			}
			
			if(requestBody.hasOwnProperty("ShippingState") && requestBody.ShippingState != null && requestBody.ShippingState != ""){
				setFieldValue(shippingAddressSubRecord, "state", requestBody.ShippingState);
			}
			
			if(requestBody.hasOwnProperty("ShippingZip") && requestBody.ShippingZip != null && requestBody.ShippingZip != ""){
				setFieldValue(shippingAddressSubRecord, "zip", requestBody.ShippingZip);
			}
	
			return;

		} catch(err){
			log.error("Error in setShippingAddress ", err);
		}
	}

    function mapShippingValues(shippingMethodName){
        shippingMethodName = shippingMethodName.toLowerCase();
        var shippingMethodId;
        
        switch (shippingMethodName) {
            case "abf freight":
                shippingMethodId = "1931984";
                break;
            case "amazon":
                shippingMethodId = "430617";
                break;
            case "ceva freight":
                shippingMethodId = "1931985";
                break;
            case "customer pickup":
                shippingMethodId = "149327";
                break;
            case "ups 2nd day air":
                shippingMethodId = "4230";
                break;
            case "ups 2nd day air am":
                shippingMethodId = "4231";
                break;
            case "ups 2nd day air hi/al/pr":
                shippingMethodId = "105444";
                break;
            case "ups 3 day select":
                shippingMethodId = "4229";
                break;
            case "ups freight":
                shippingMethodId = "436806";
                break;
            case "ups freight ltl guaranteed":
                shippingMethodId = "677964";
                break;
            case "ups freight ltl guaranteed am":
                shippingMethodId = "677965";
                break;
            case "ups ground":
                shippingMethodId = "3";
                break;
            case "ups ground hi,al,pr":
                shippingMethodId = "105445";
                break;
            case "ups next day air":
                shippingMethodId = "4233";
                break;
            case "ups next day air early a.m.":
                shippingMethodId = "4234";
                break;
            case "ups next day air hi,al,pr":
                shippingMethodId = "105446";
                break;
            case "ups next day air saver":
                shippingMethodId = "4232";
                break;
            default:
                shippingMethodId = "3"; // UPS Ground
                break;
        }

        return shippingMethodId;
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
    
    function formatDate(dateString){
    	// NetSuite needs a Z at the end of the date string or it new Date function will not work
    	// If the last character is not a Z, add it to the end
    	log.debug("formatDate called");
    	log.debug("dateString", dateString);
    	var lastCharacter = dateString.slice(-1);
    	log.debug("lastCharacter", lastCharacter);
    	if(lastCharacter != "Z"){
    		dateString = dateString.concat("Z");
    		log.debug("dateString after concat", dateString);
    	}
    	
    	var date = new Date(dateString);
    	log.debug("date", date);
    	return date;
	}
    
});
