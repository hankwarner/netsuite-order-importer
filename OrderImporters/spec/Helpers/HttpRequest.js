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
      }
}