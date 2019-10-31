
module.exports = {
    generateOrderNumber(){
        var orderNumber = Math.random() * 9999999999999999;
        orderNumber = orderNumber.toString();
        return orderNumber;
    }
}