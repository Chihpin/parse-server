var Pay=require("pay_paymax");


Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});


Parse.Cloud.define('pay_create', function(req, res) {
  Pay.createCharge();
});
