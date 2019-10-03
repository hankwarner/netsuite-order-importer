/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/record', 'N/search'],

function(email, record, search) {

    function doPost(requestBody) {
        // TODO: return back an object with customer ID and shipping status
        try{
            log.audit("requestBody", requestBody);

            if(!requestBody.hasOwnProperty("email")){
                throw new Error("Email is required");

            } else {
                var customerEmail = requestBody.email;
            }
            
            // Check if customer exists
            var customerId = getCustomerByEmail(customerEmail);
            
            if(customerId == false){
                createCustomerRecord(customerEmail, requestBody);

            } else {
                return customerId;
            }

        } catch(err){
            return err;
        }
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
               search.createColumn({name: "internalid"})
            ]
        });

        // Get the first customer that matches
        var customerSearchByEmailResults = customerSearchByEmail.run().getRange(0, 1);

        if(!customerSearchByEmailResults || customerSearchByEmailResults.length == 0){
            return false;

        } else {
            var customerId = customerSearchByEmailResults[0].getValue(customerSearchByEmail.columns[0]);

            return customerId;
        }
    }
    
    function createCustomerRecord(customerEmail, requestBody){
        try{
            var customerRecord = record.create({
                type: record.Type.CUSTOMER
            });

            // Required fields
            customerRecord.setValue({
                fieldId: "email",
                value: customerEmail
            });

            if(!requestBody.hasOwnProperty("firstName") || !requestBody.hasOwnProperty("lastName")){
                throw new Error("First and last name is required");

            } else {
                var customerName = requestBody.firstName + " " + requestBody.lastName;

                customerRecord.setValue({
                    fieldId: "altname",
                    value: customerName
                });
            }

            if(!requestBody.hasOwnProperty("department")){
                // Set to D2C if department value is not passed
                customerRecord.setValue({
                    fieldId: "custentity6",
                    value: "27"
                });

            } else {
                var customerDepartment = requestBody.department;

                customerRecord.setValue({
                    fieldId: "custentity6",
                    value: customerDepartment
                });
            }

            // Optional fields
            if(requestBody.hasOwnProperty("phone")){
                var customerPhone = requestBody.phone;
            }
            customerRecord.setValue({
                fieldId: "",
                value: ""
            });

        } catch(err){
            throw err;
        }
    }
    
});
