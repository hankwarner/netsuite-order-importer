/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/https', 'N/record', 'N/search'],

function(email, https, record, search) {

    function doPost(requestBody) {
    	log.audit("requestBody", requestBody);
    	
    	
    }

    return {
        post: doPost
    };
    
});
