/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'S/teamslog.js', 'S/helpers.js'],

function(record, search, teamsLog, helper) {
	const teamsUrl = "https://outlook.office.com/webhook/ccaff0e4-631a-4421-b57a-c899e744d60f@3c2f8435-994c-4552-8fe8-2aec2d0822e4/IncomingWebhook/9627607123264385b536d2c1ff1dbd4b/f69cfaae-e768-453b-8323-13e5bcff563f";
    var hasRelatedEstimate;
    
    function doPost(requestBody) {
        try{
            log.audit("requestBody", requestBody);

            // Throw exception if any required fields are missing from the request
            var requiredFields = [
                "CustomerId",
                "Items",
                "SiteOrderNumber",
                "BillingFirstName",
                "BillingLastName",
                "BillingLine1",
                "BillingZip",
                "ShippingFirstName",
                "ShippingLastName",
                "ShippingLine1",
                "ShippingZip",
            ];
            checkRequiredFields(requestBody, requiredFields);
            
            // Check if there is an existing Sales Order with the same Site Order Number ('PO #' field on the Sales Order)
            var findDuplicateOrdersResults = findDuplicateOrders(requestBody.SiteOrderNumber, requestBody.Department);
            var isDuplicate = findDuplicateOrdersResults[0];

            if(isDuplicate){
                log.audit("Duplicate order", requestBody.SiteOrderNumber);
                var salesOrderRecordId = findDuplicateOrdersResults[1];
            
            } else {
                // Adds a flag called "existing" and sets all items to false
                items = buildItemObject(requestBody.Items);

                // If there is a related estimate, transform the estimate record. Else create a new sales order record.
                var salesOrderRecord = createSalesOrderRecord(requestBody);

                var salesOrderRecordId = setSalesOrderValues(salesOrderRecord, requestBody, items);
                log.audit("salesOrderRecordId", salesOrderRecordId);
            }

            var response = {
            	salesOrderRecordId: salesOrderRecordId
            }

        } catch(err){
        	log.error("Error in WebsiteOrderImporterRESTlet", err);
        	var data = {
				from: "Error in WebsiteOrderImporterRESTlet",
				message: err.message,
				color: "red"
			}
        	teamsLog.log(data, teamsUrl);
        	
        	var response = {
            	error: err.message
            }

        } finally {
            return response;
        }
    }

    return {
        post: doPost
    };


    function checkRequiredFields(requestBody, requiredFields){
        for(var i=0; i < requiredFields.length; i++){
            var requiredField = requiredFields[i];
            if(!requestBody.hasOwnProperty(requiredField) || !requestBody[requiredField] || requestBody[requiredField].length == 0){
                throw new Error(requiredField + " is required");
            }
        }
    }


    function findDuplicateOrders(orderNumber, department){
        try {
            var salesOrderSearch = search.create({
                type: "salesorder", 
                filters: [
                   ["type","anyof","SalesOrd"], 
                   "AND", 
                   ["mainline","is","T"],
                   "AND", 
                   ["otherrefnum","equalto",orderNumber],
                   "AND",
                   ["department","anyof",department]
                ],
                columns: [
                   search.createColumn({name: "internalid"})
                ]
            });
             
            var salesOrderSearchResult = salesOrderSearch.run().getRange(0, 1);
    
            if(salesOrderSearchResult.length >= 1){
                var isDuplicate = true;
                var salesOrderRecordId = salesOrderSearchResult[0].getValue(salesOrderSearch.columns[0]);
            } else {
                var isDuplicate = false;
            }
    
            return [isDuplicate, salesOrderRecordId];

        } catch (err) {
            log.error("Error in findDuplicateOrders", err);
            var data = {
				from: "Error in WebsiteOrderImporterRESTlet findDuplicateOrders",
				message: err.message,
				color: "yellow"
			}
            teamsLog.log(data, teamsUrl);
        }
    }


    function buildItemObject(items){
        try{
            for (var index in items) {
                items[index].existing = false;
            }
            return items;

        } catch(err){
            log.error("Error in buildItemObject ", err);
            throw err;
        }
    }


    function createSalesOrderRecord(requestBody){
        var customerId = requestBody.CustomerId;

        if(requestBody.hasOwnProperty("RelatedEstimate") && requestBody.RelatedEstimate){
            log.audit("has related estimate", requestBody.RelatedEstimate);
            hasRelatedEstimate = true;

            // Split RelatedEstimate value to get the estimate internal ID
            if(requestBody.RelatedEstimate.indexOf("|") != -1){
                var relatedEstimateId = requestBody.RelatedEstimate.split("|")[1];
            } else {
                var relatedEstimateId = requestBody.RelatedEstimate;
            }
            
            var salesOrderRecord = record.transform({
                fromType: record.Type.ESTIMATE,
                fromId: relatedEstimateId,
                toType: record.Type.SALES_ORDER,
                isDynamic: true
            });
            
            var relatedEstimateFields = [
                ["custbody261", requestBody.RelatedEstimate],
                ["entity", customerId]
            ];
            setFieldValues(salesOrderRecord, relatedEstimateFields);

            // Set the "existing" flag to true for items that were already on the estimate record
            items = checkItemsOnRelatedEstimate(salesOrderRecord, items);

        } else {
            log.audit("does not have related estimate");
            hasRelatedEstimate = false;
            var salesOrderRecord = record.create({
                type: record.Type.SALES_ORDER,
                isDynamic: true,  
                defaultValues: {
                    entity: customerId
                }
            });
        }

        return salesOrderRecord;
    }


    function checkItemsOnRelatedEstimate(salesOrderRecord, items) {
        try{
        	var itemCount = salesOrderRecord.getLineCount('item');
            
            for (var i = 0; i < itemCount; i++) {
                var itemIdInNetSuite = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                var quantityInNetSuite = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });

                for (var index in items) {
                    var item = items[index];
                    var itemIdOnLineItem = getItemId(item);
                    
                    if (!item.existing && itemIdOnLineItem == itemIdInNetSuite && item.Quantity == quantityInNetSuite) {
                    	item.existing = true;
                    }
                }
            }

            return items;
            
        } catch(err){
        	log.error("Error in checkItemsOnRelatedEstimate ", err);
        	throw err;
        }
    }


    function setSalesOrderValues(salesOrderRecord, requestBody, items){
        try {
            log.debug("salesOrderRecord", salesOrderRecord);
            // Default taxable to true
            salesOrderRecord.setValue({ fieldId: "istaxable", value: true });

            if(requestBody.hasOwnProperty("ShippingMethodName")){
                var shippingMethodName = requestBody.ShippingMethodName;
                requestBody.ShippingMethodName = helper.mapShippingValues(shippingMethodName);
            }

            var propertiesAndFieldIds = [
                // property, fieldId
                ["PaymentMethodId", "paymentmethod"],
                ["SH", "shippingcost"],
                ["Department", "department"],
                ["Email", "custbody1"],
                ["SignifydID", "custbody277"],
                ["SiteOrderNumber", "otherrefnum"],
                ["SiteOrderNumber", "custbody_ss_brontoid"],
                ["JobName", "custbody61"],
                ["DiscountNames", "custbody209"],
                ["AltOrderNumber", "custbody270"],
                ["CheckoutTypeId", "custbody40"],
                ["UserTypeId", "custbody28"],
                ["Note", "memo"],
                ["Microsite", "custbody242"],
                ["IPAddress", "custbody267"],
                ["ShippingMethodName", "shipmethod"]
            ];
            
            // If a related estimate exists, do not set Same Day Shipping (ie, carry value over from the estimate)
            if(!hasRelatedEstimate){
                propertiesAndFieldIds.push(["SameDayShipping", "custbody7"]);
            }
            log.debug("requestBody", requestBody);
            checkPropertyAndSetValues(salesOrderRecord, requestBody, propertiesAndFieldIds);

            setBillingAddress(salesOrderRecord, requestBody);
            setShippingAddress(salesOrderRecord, requestBody);

            addItems(salesOrderRecord, items);
            log.debug("salesOrderRecord", salesOrderRecord);
            var salesOrderRecordId = salesOrderRecord.save();
            
            return salesOrderRecordId;

        } catch(err) {
            log.error("Error in setSalesOrderValues", err);
            throw err;
        }
    }


    function addItems(salesOrderRecord, items){
        for (var item in items) {
            var lineItem = items[item];

            if(lineItem.existing){
                continue;
            }
            
            var itemId = getItemId(lineItem);
            var customPriceLevel = "-1";
            var sublistId = "item";

            var itemValues = [
                // fieldId, value
                ["item", itemId],
                ["quantity", lineItem.Quantity],
                ["price", customPriceLevel],
                ["rate", lineItem.Rate],
                ["amount", lineItem.Amount]
            ];

            var optionalItemFields = [
                ["DiscountNames", "custcol34"],
                ["OrderLevelDiscountAmount", "custcol35"],
                ["PersonalItem", "custcol_ss_nestpropersonalitem"]
            ];
            
            addOptionalItemFields(lineItem, optionalItemFields, itemValues);
            
            setSublistValues(salesOrderRecord, sublistId, itemValues);
        }
        return;
    }


    function setBillingAddress(salesOrderRecord, requestBody){
		try{
            var billingAddressSubRecord = salesOrderRecord.getSubrecord({ fieldId: 'billingaddress' });
            
            requestBody.BillingAddressee = requestBody.BillingFirstName + " " + requestBody.BillingLastName;

            var billingValues = [
                // property, fieldId
                ["BillingAddressee", "addressee"],
                ["BillingLine1", "addr1"],
                ["BillingLine2", "addr2"],
                ["BillingCity", "city"],
                ["BillingState", "state"],
                ["BillingZip", "zip"],
                ["BillingCountry", "country"]
            ];
            checkPropertyAndSetValues(billingAddressSubRecord, requestBody, billingValues);

            return;

		} catch(err) {
			log.error("Error in setBillingAddress", err);
			var data = {
				from: "Error in WebsiteOrderImporterRESTlet setBillingAddress",
				message: err.message,
				color: "yellow"
			}
        	teamsLog.log(data, teamsUrl);
		}
	}


	function setShippingAddress(salesOrderRecord, requestBody){
		try {
			var shippingAddressSubRecord = salesOrderRecord.getSubrecord({ fieldId: 'shippingaddress' });
            
            requestBody.ShippingAddressee = requestBody.ShippingFirstName + " " + requestBody.ShippingLastName;
            
            var shippingValues = [
                // property, fieldId
                ["ShippingAddressee", "addressee"],
                ["ShippingLine1", "addr1"],
                ["ShippingLine2", "addr2"],
                ["ShippingCity", "city"],
                ["ShippingState", "state"],
                ["ShippingZip", "zip"],
                ["ShippingCountry", "country"],
                ["ShippingPhone", "addrphone"]
            ];
            checkPropertyAndSetValues(shippingAddressSubRecord, requestBody, shippingValues);

			return;

		} catch(err){
			log.error("Error in setShippingAddress ", err);
			var data = {
				from: "Error in setShippingAddress",
				message: err.message,
				color: "yellow"
			}
        	teamsLog.log(data, teamsUrl);
		}
	}
    
    
	function getItemId(lineItem){
		// The item's internal ID will potentially be in two places: ItemId or CustomNetSuiteID, so we check both
		var itemId;
		
		if(lineItem.hasOwnProperty("ItemId") && lineItem.ItemId && lineItem.ItemId != "0"){
        	itemId = lineItem.ItemId;
        		
        } else if(lineItem.hasOwnProperty("CustomNetSuiteID") && lineItem.CustomNetSuiteID){
        	itemId = lineItem.CustomNetSuiteID;
        	
        } else {
        	throw new Error("No item id was found on line item: ", lineItem);
        }
		
		return itemId;
	}


    function checkPropertyAndSetValues(salesOrderRecord, requestObj, propertiesAndFieldIds){
        for(var i=0; i < propertiesAndFieldIds.length; i++){
            var property = propertiesAndFieldIds[i][0];
            var fieldId = propertiesAndFieldIds[i][1];
            log.debug("property",property);
            log.debug("fieldId",fieldId);
            if(requestObj.hasOwnProperty(property) && requestObj[property]){
                var value = requestObj[property];
                
            } else {
                // Sets the default value if one is not provided in the request
                var value = getDefaultValue(property);
            }
            log.debug("value",value);
            salesOrderRecord.setValue({ fieldId: fieldId, value: value });
        }

        log.debug("salesOrderRecord", salesOrderRecord);
        return;
    }


    function setSublistValues(salesOrderRecord, sublistId, itemValues){
        try {
            salesOrderRecord.selectNewLine({ sublistId: sublistId });
            
            for(var i=0; i < itemValues.length; i++){
                var fieldId = itemValues[i][0];
                var value = itemValues[i][1];
                
                salesOrderRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldId,
                    value: value
                });
            }

            salesOrderRecord.commitLine({ sublistId: sublistId });
    
            return;

        } catch (err) {
            var message = {
                from: "Error setSublistValues",
                message: err.message,
                color: "yellow"
            }
            teamsLog.log(message, teamsUrl);
        }
    }


    function addOptionalItemFields(lineItem, optionalItemFields, itemValues){
        try{
			for(var i=0; i < optionalItemFields.length; i++){
                var property = optionalItemFields[i][0];

                if(lineItem.hasOwnProperty(property) && lineItem[property]){
                    var fieldId = optionalItemFields[i][1];
                    var value = lineItem[property];
                    itemValues.push([fieldId, value]);
                }
            }

		} catch(err){
			log.error("Error in addOptionalItemFields ", err);
			var data = {
				from: "Error in addOptionalItemFields",
				message: "lineItem: " + lineItem + " Error msg: " + err.message,
				color: "yellow"
			}
        	teamsLog.log(data, teamsUrl);
		}
        
    }


    function getDefaultValue(property){
        var defaultValue;

        switch (property) {
            case "PaymentMethodId":
            case "CheckoutTypeId":
                defaultValue = "1";
                break;
            case "UserTypeId":
                defaultValue = "2";
                break;
            case "SameDayShipping":
                defaultValue = "3";
                break;
            case "BillingCountry":
            case "ShippingCountry":
                defaultValue = "US";
                break;
            default:
                defaultValue = "";
                break;
        }

        return defaultValue;
    }


    function setFieldValues(salesOrderRecord, fieldIdAndValueArray){
        try {
            for(var i=0; i < fieldIdAndValueArray.length; i++){
                var fieldId = fieldIdAndValueArray[i][0];
                var value = fieldIdAndValueArray[i][1];
    
                salesOrderRecord.setValue({
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
});