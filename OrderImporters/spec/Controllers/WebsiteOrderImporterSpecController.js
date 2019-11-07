/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'S/helpers'],

function(record, helper) {

    function onRequest(context) {
    	try{
            var functionType = context.request.parameters.functionType;
            
            if(functionType == "createEstimate"){
                var sameDayShipping = context.request.parameters.sameDayShipping;
                var response = createEstimate(sameDayShipping);

            } else if(functionType == "create"){
                var salesOrderRecordId = context.request.parameters.salesOrderRecordId;
                log.audit("salesOrderRecordId", salesOrderRecordId);

                var response = getSalesOrderRecordValues(salesOrderRecordId);
            }
            
        } catch(err) {            
			log.error("Error", err);
        	var response = {
                error: err.message
            }
			
        } finally {
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

    function createEstimate(sameDayShipping) {
        var estimateRecord = record.create({
            type: record.Type.ESTIMATE,
            isDynamic: true,
            defaultValues: {
                entity: 17494445
            } 
        });

        // Set Same-Day Shipping
        log.debug("sameDayShipping", sameDayShipping);
        estimateRecord.setValue({
            fieldId: "custbody7",
            value: sameDayShipping
        });

        estimateRecord.selectNewLine({
            sublistId: "item"
        });

        estimateRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: 10268
        });

        estimateRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: 2
        });

        // Set Price Level to Custom
        estimateRecord.setCurrentSublistValue({
            sublistId: 'item', 
            fieldId: 'price', 
            value: "-1"
        });

        estimateRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: 120.00
        });

        estimateRecord.commitLine({
            sublistId: 'item'
        });

        const estimateRecordId = estimateRecord.save();

        return estimateRecordId.toString();
    } 
    
    function getSalesOrderRecordValues(salesOrderRecordId){
        try{
            // Load the item record and get values
            var salesOrderRecord = record.load({
                type: record.Type.SALES_ORDER,
                id: salesOrderRecordId,
                isDynamic: true
            });

            var fieldIdsArray = 
            [
                // Payment info
                ["paymentmethod", "PaymentMethodId"],
                ["shippingcost", "SH"],
                ["custbody277", "SignifydID"],
                ["custbody209", "DiscountNames"],
                ["custbody40", "CheckoutTypeId"],
                ["istaxable", "Taxable"],

                // Order information
                ["otherrefnum", "SiteOrderNumber"],
                ["custbody7", "SameDayShipping"],
                ["custbody61", "JobName"],

                // General info
                ["custbody_ss_brontoid", "BrontoId"],
                ["custbody1", "Email"],
                ["custbody28", "UserTypeId"],
                ["department", "Department"],
                ["memo", "Note"],
                ["custbody28", "UserTypeId"],
                
                // Website information
                ["custbody242", "Microsite"],
                ["custbody267", "IPAddress"],

                // Related estimate
                ["createdfrom", "RelatedEstimate"]
            ];
            
            var salesOrderRecordValues = helper.getValues(salesOrderRecord, fieldIdsArray);
            var billingAddressValues = getBillingAddressValues(salesOrderRecord);
            var shippingAddressValues = getShippingAddressValues(salesOrderRecord);
            var lineItemValues = getlineItemValues(salesOrderRecord);
            
            var response = {
                Taxable: salesOrderRecordValues.Taxable,
                PaymentMethodId: salesOrderRecordValues.PaymentMethodId,
                SH: salesOrderRecordValues.SH,
                SignifydID: salesOrderRecordValues.SignifydID,
                SiteOrderNumber: salesOrderRecordValues.SiteOrderNumber,
                BrontoId: salesOrderRecordValues.BrontoId,
                UserTypeId: salesOrderRecordValues.UserTypeId,
                JobName: salesOrderRecordValues.JobName,
                DiscountNames: salesOrderRecordValues.DiscountNames,
                CheckoutTypeId: salesOrderRecordValues.CheckoutTypeId,
                Note: salesOrderRecordValues.Note,
                Microsite: salesOrderRecordValues.Microsite,
                IPAddress: salesOrderRecordValues.IPAddress,
                Email: salesOrderRecordValues.Email,
                Department: salesOrderRecordValues.Department,
                UserTypeId: salesOrderRecordValues.UserTypeId,
                SameDayShipping: salesOrderRecordValues.SameDayShipping,
                BillingAddressee: billingAddressValues.BillingAddressee,
                BillingLine1: billingAddressValues.BillingLine1,
                BillingLine2: billingAddressValues.BillingLine2,
                BillingCity: billingAddressValues.BillingCity,
                BillingState: billingAddressValues.BillingState,
                BillingZip: billingAddressValues.BillingZip,
                ShippingAddressee: shippingAddressValues.ShippingAddressee,
                ShippingLine1: shippingAddressValues.ShippingLine1,
                ShippingLine2: shippingAddressValues.ShippingLine2,
                ShippingCity: shippingAddressValues.ShippingCity,
                ShippingState: shippingAddressValues.ShippingState,
                ShippingZip: shippingAddressValues.ShippingZip,
                lineItemValues: lineItemValues,
                RelatedEstimate: salesOrderRecordValues.RelatedEstimate
            }
            
        } catch(err) {
			log.error('Error', err);
        	var response = {
                error: err.message
            }
        }

        return response;
    }

    function getBillingAddressValues(salesOrderRecord){
        var billingAddressSubRecord = salesOrderRecord.getSubrecord({ fieldId: 'billingaddress' });

        var fieldIdsArray = 
        [
            // Billing Address
            ["addressee", "BillingAddressee"],
            ["addr1", "BillingLine1"],
            ["addr2", "BillingLine2"],
            ["city", "BillingCity"],
            ["state", "BillingState"],
            ["zip", "BillingZip"],
        ];

        var billingAddressValues = helper.getValues(billingAddressSubRecord, fieldIdsArray);

        return billingAddressValues;
    }

    function getShippingAddressValues(salesOrderRecord){
        var shippingAddressSubRecord = salesOrderRecord.getSubrecord({ fieldId: 'shippingaddress' });

        var fieldIdsArray = 
        [
            ["addressee", "ShippingAddressee"],
            ["addr1", "ShippingLine1"],
            ["addr2", "ShippingLine2"],
            ["city", "ShippingCity"],
            ["state", "ShippingState"],
            ["zip", "ShippingZip"]
        ];
        
        var shippingAddressValues = helper.getValues(shippingAddressSubRecord, fieldIdsArray);	

        return shippingAddressValues;
    }

    function getlineItemValues(salesOrderRecord){
        var lineItemValues = {};
        var itemCount = salesOrderRecord.getLineCount('item');
        
        for(var i=0; i < itemCount; i++){
            var itemId = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            var quantity = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
            var amount = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
            var rate = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
            var discountName = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol34', line: i });
            var itemNotes = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol19', line: i });
            var orderLevelDiscount = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol35', line: i });

            lineItemValues[itemId] = {
                quantity: quantity,
                amount: amount,
                rate: rate,
                discountName: discountName,
                itemNotes: itemNotes,
                orderLevelDiscount: orderLevelDiscount
            }
        }
        log.debug("lineItemValues", lineItemValues);
        return lineItemValues;
    }
    
});
