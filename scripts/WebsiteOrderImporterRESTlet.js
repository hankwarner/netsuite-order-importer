/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'S/teamslog.js', 'N/email', 'N/url'],

function(record, search, teamsLog, email, url) {
	const teamsUrl = "https://outlook.office.com/webhook/ccaff0e4-631a-4421-b57a-c899e744d60f@3c2f8435-994c-4552-8fe8-2aec2d0822e4/IncomingWebhook/9627607123264385b536d2c1ff1dbd4b/f69cfaae-e768-453b-8323-13e5bcff563f";
    const avatax = "1990053";
    const nestProMicrositeId = '31';
    var hasRelatedEstimate;
    var siteOrderNumber;
    
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
                "ShippingZip"
            ];
            checkRequiredFields(requestBody, requiredFields);
            
            siteOrderNumber = requestBody.SiteOrderNumber;

            // Check if there is an existing Sales Order with the same Site Order Number ('PO #' field on the Sales Order)
            var findDuplicateOrdersResults = findDuplicateOrders(siteOrderNumber, requestBody.Department);
            var isDuplicate = findDuplicateOrdersResults[0];

            if(isDuplicate){
                log.audit("Duplicate order", siteOrderNumber);
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
        }

        return response;
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

            // Set Same Day Shipping from the estimate's value
            var sameDayShipping = salesOrderRecord.getValue({
                fieldId: "custbody7"
            });

            requestBody.SameDayShipping = sameDayShipping;
            
            //Default PD to blank for SOs with an estimate
            var itemCount = salesOrderRecord.getLineCount('item');
            for (var j = 0; j < itemCount; j++) {
            	
            	salesOrderRecord.selectLine({
    			    sublistId : "item",
    			    line : j
    			});
            	salesOrderRecord.setCurrentSublistValue({
					sublistId : "item",
					fieldId : "custcol_ss_precisiondelivery",
					value : ''
				    });
			}
            
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
            if(requestBody.hasOwnProperty("ShippingMethodName")){
                var shippingMethodName = requestBody.ShippingMethodName;
                requestBody.ShippingMethodName = mapShippingValues(shippingMethodName);
            }

            setTaxExemptStatusOnOrder(requestBody);

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
                ["Taxable", "istaxable"],
				["TaxVendor", "taxitem"],
                ["ShippingMethodName", "shipmethod"],
                ["SameDayShipping", "custbody7"]
            ];
            
            checkPropertyAndSetValues(salesOrderRecord, requestBody, propertiesAndFieldIds);

            // Nest Pro orders should be Source Complete
            if(requestBody.Microsite == nestProMicrositeId){
                salesOrderRecord.setValue({
                    fieldId: 'custbody_ss_sourcecomplete',
                    value: true
                });
            }

            setBillingAddress(salesOrderRecord, requestBody);
            setShippingAddress(salesOrderRecord, requestBody);

            addItems(salesOrderRecord, items);

            var salesOrderRecordId = salesOrderRecord.save();
            
            return salesOrderRecordId;

        } catch(err) {
            log.error("Error in setSalesOrderValues", err);
            throw err;
        }
    }


    function setTaxExemptStatusOnOrder(requestBody){
        try {
            // Get the customer tax exempt states
            var customerTaxExemptStateSearch = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: requestBody.CustomerId,
                columns: "custentity_ss_taxexemptstates"
            });

            // Return if customer has is not tax exempt in any states
            if(customerTaxExemptStateSearch.custentity_ss_taxexemptstates.length == 0) return;

            var taxExemptStatesArray = customerTaxExemptStateSearch.custentity_ss_taxexemptstates.map(x => x.text);
            log.audit("taxExemptStatesArray", taxExemptStatesArray);

            var shippingState = requestBody.ShippingState;

            // Taxable defaults to true, so we only need to override if it is false
            if(taxExemptStatesArray.includes(shippingState)){
                log.audit("Order is tax exempt");
                requestBody.Taxable = false;
            }

            return;

        } catch (err) {
            log.error("Error in setTaxExemptStatusOnOrder");
            var message = {
				from: "Error in WebsiteOrderImporterRESTlet setTaxExemptStatusOnOrder",
				message: err.message,
				color: "red"
			}
        	teamsLog.log(message, teamsUrl);
        }

    }


    function addItems(salesOrderRecord, items){
        for (var item in items) {
            var lineItem = items[item];

            if(lineItem.existing){
                continue;
            }
            
            var itemId = getItemId(lineItem);

            // If the item is marked inactive, we will not be able to add it to the order
            var itemStatus = getItemStatus(itemId);
            
            if(itemStatus.isInactive){
                activateItem(itemId, itemStatus.isKit);
            }
            var reqShipMethodId = '';
            var precisionDelivery = '';
            if(lineItem.ShippingMethodName == 'Standard'){
            	reqShipMethodId = 1;
            }else if(lineItem.ShippingMethodName == 'Priority'){
            	reqShipMethodId = 2;
            }else if(lineItem.ShippingMethodName == '2-Hour Delivery'){
            	reqShipMethodId = 3;
            	precisionDelivery = 1;
            }

            var customPriceLevel = "-1";
            var itemValues = [
                // fieldId, value
                ["item", itemId],
                ["quantity", lineItem.Quantity],
                ["price", customPriceLevel],
                ["rate", lineItem.Rate],
                ["amount", lineItem.Amount],
                ["custcol_ss_shippingguideline", reqShipMethodId],
                ["custcol_ss_precisiondelivery", precisionDelivery]
            ];


            var optionalItemFields = [
                ["DiscountNames", "custcol34"],
                ["OrderLevelDiscountAmount", "custcol35"],
                ["PersonalItem", "custcol_ss_nestpropersonalitem"]
            ];
            
            addOptionalItemFields(lineItem, optionalItemFields, itemValues);
            
            var sublistId = "item";
            setSublistValues(salesOrderRecord, sublistId, itemValues);
        }
        return;
    }


    function setBillingAddress(salesOrderRecord, requestBody){
		try{
            // Clear the default address:
            salesOrderRecord.setValue({
                fieldId: "billaddresslist",
                value: null
            });
            
            var billingAddressSubRecord = salesOrderRecord.getSubrecord({ fieldId: 'billingaddress' });
            
            requestBody.BillingAddressee = requestBody.BillingFirstName + " " + requestBody.BillingLastName;

            var billingValues = [
                // property, fieldId
                ["BillingLine1", "addr1"],
                ["BillingLine2", "addr2"],
                ["BillingCity", "city"],
                ["BillingState", "state"],
                ["BillingZip", "zip"],
                ["BillingCountry", "country"]
            ];

            // If a BillingCompany exist, set it as the adressee and attn: to the customer name. Else, set customer name as the addressee
            if(requestBody.hasOwnProperty("BillingCompany") && requestBody.BillingCompany){
                billingValues.push(
                    ["BillingAddressee", "attention"],
                    ["BillingCompany", "addressee"]
                );

            } else {
                billingValues.push(
                    ["BillingAddressee", "addressee"]
                );
            }

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
            // Clear the default address:
            salesOrderRecord.setValue({
                fieldId: "shipaddresslist",
                value: null
            });
            
            var shippingAddressSubRecord = salesOrderRecord.getSubrecord({ fieldId: 'shippingaddress' });
            
            requestBody.ShippingAddressee = requestBody.ShippingFirstName + " " + requestBody.ShippingLastName;
            
            var shippingValues = [
                // property, fieldId
                ["ShippingLine1", "addr1"],
                ["ShippingLine2", "addr2"],
                ["ShippingCity", "city"],
                ["ShippingState", "state"],
                ["ShippingZip", "zip"],
                ["ShippingCountry", "country"],
                ["ShippingPhone", "addrphone"]
            ];

            // If a ShippingCompany exist, set it as the adressee and attn: to the customer name. Else, set customer name as the addressee
            if(requestBody.hasOwnProperty("ShippingCompany") && requestBody.ShippingCompany){
                shippingValues.push(
                    ["ShippingAddressee", "attention"],
                    ["ShippingCompany", "addressee"]
                );

            } else {
                shippingValues.push(
                    ["ShippingAddressee", "addressee"]
                );
            }

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


    function getItemStatus(itemId) {
        var isKit = false;
        
        var itemLookup = search.lookupFields({
            type: search.Type.INVENTORY_ITEM,
            id: itemId,
            columns: "isinactive"
        });

        if(Object.keys(itemLookup).length == 0) {
            itemLookup = search.lookupFields({
                type: search.Type.KIT_ITEM,
                id: itemId,
                columns: "isinactive"
            });
            isKit = true;
        }

        return {
            isKit: isKit,
            isInactive: itemLookup.isinactive
        }
    }


    function activateItem(itemId, isKit) {
        try {
            var itemRecordType = isKit ? record.Type.KIT_ITEM : record.Type.INVENTORY_ITEM;
            
            record.submitFields({
                type: itemRecordType,
                id: itemId,
                values: {
                    isinactive: false
                }
            });
            log.audit("Item has been activated", "Item Id " + itemId);

            notifyOperationsTeam(itemId, itemRecordType);

        } catch(err) {
            log.error("Unable to activate item id: " + itemId, err);
            var message = {
                from: "Error activateItem",
                message: err.message,
                color: "yellow"
            }
            teamsLog.log(message, teamsUrl);
        }
    }

    function notifyOperationsTeam(itemId, itemRecordType) {
        try{
            var baseUrl = "https://634494.app.netsuite.com/";

            var relativeUrl = url.resolveRecord({
                recordType: itemRecordType,
                recordId: itemId
            });

            var itemRecordUrl = baseUrl + relativeUrl;
            
            email.send({
                author: 16050078,
                recipients: 'enterpriseoperations@hmwallace.com',
                cc: ['clinton.urbin@hmwallace.com', 'Dru.Brook@hmwallace.com'],
                bcc: ['h.warner@supply.com'],
                subject: 'Item Id '+itemId+' Activated in NetSuite',
                replyTo: 'SuiteSquad@hmwallace.com',
                body: 'Item Id '+itemId+' has been changed from inactive to active in NetSuite '+
                    'because a Supply.com order has been placed with it. PO # '+ siteOrderNumber +
                    '. Item record: ' + itemRecordUrl
            });

        } catch(err) {
            log.error("Error in notifyOperationsTeam " + err);
            var message = {
                from: "Error in notifyOperationsTeam",
                message: err.message,
                color: "yellow"
            }
            teamsLog.log(message, teamsUrl);
        }
    }


    function checkPropertyAndSetValues(salesOrderRecord, requestObj, propertiesAndFieldIds){
        for(var i=0; i < propertiesAndFieldIds.length; i++){
            var property = propertiesAndFieldIds[i][0];
            var fieldId = propertiesAndFieldIds[i][1];

            if((requestObj.hasOwnProperty(property) && requestObj[property]) || typeof requestObj[property] == "boolean"){
                var value = requestObj[property];
                
            } else {
                // Sets the default value if one is not provided in the request
                var value = getDefaultValue(property);
            }

            salesOrderRecord.setValue({ fieldId: fieldId, value: value });
        }

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
            case "Taxable":
				defaultValue = true;
				break;
			case "TaxVendor":
				defaultValue = avatax;
				break;
            default:
                defaultValue = "";
                break;
        }

        return defaultValue;
    }


    function mapShippingValues(shippingMethodName){
        shippingMethodName = shippingMethodName.toLowerCase();
        var shippingMethodId;

        switch (shippingMethodName) {
            case "2-hour delivery":
                shippingMethodId = "315203"; // Shipper's Choice
                break;
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
            case "priority":
                shippingMethodId = "4233"; // UPS Next Day Air
                break;
            case "shippers choice":
                shippingMethodId = "315203";
                break;
            case "standard":
                shippingMethodId = "315203"; // Shipper's Choice
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
                shippingMethodId = "315203"; // Shipper's Choice
                break;
        }

        return shippingMethodId;
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