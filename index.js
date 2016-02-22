var express = require('express');

var app = express();

app.listen('3000', function(){
    //TODO
});

app.get('/test', function(req, res){
    res.end('test');
});