/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/https', 'N/record', 'N/search'],

function(email, https, record, search) {
    /**
     * Function called upon sending a POST request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPost(requestBody) {
    	
    }

    return {
        post: doPost
    };
    
});
