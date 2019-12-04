const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

module.exports = {
    get(url){
        try{        
            var request = new XMLHttpRequest();
            request.open('GET', url, false);
            request.setRequestHeader("Content-Type", "application/json");
            request.setRequestHeader("User-Agent", "Mozilla/5.0");
            request.onerror = (err) => {
                console.error(request.statusText);
                throw err;
            }
            request.send(null);
        
            // Parse the response object before sending back
            var response = JSON.parse(request.responseText);
        
            return response;
            
        } catch(err) {
            console.error(err);
        }
    },

    post(options){
        try{
            var url = options.url;
            var body = options.body;
            var headers = options.headers;
            var jsonRequest = JSON.stringify(body);
        
            var request = new XMLHttpRequest();
            request.open('POST', url, false); // 'false' makes it synchronous
            
            // Set the content-type to json if no headers are provided
            if(!headers){
                headers = {
                    name: "Content-Type",
                    value: "application/json"
                }
                request.setRequestHeader(headers.name, headers.value);

            } else {
                for(var headerName in headers){
                    request.setRequestHeader(headerName, headers[headerName]);
                }
            }

            request.onerror = (err) => {
                console.error(request.statusText);
                throw err;
            };
            request.send(jsonRequest);
        
            // Parse the response object before sending back
            var response = {};
            response.status = request.status;
            response.body = request.responseText;
        
            return response;
        
        } catch(err) {
            console.error(err);
        }
    }
}