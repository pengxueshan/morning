var AV = require('leanengine');
var APP_ID = process.env.LC_APP_ID;
var APP_KEY = process.env.LC_APP_KEY;
var MASTER_KEY = process.env.LC_APP_MASTER_KEY;
AV.initialize(APP_ID, APP_KEY, MASTER_KEY);

var express = require('express');
var handlebars = require('express3-handlebars').create({defaultLayout: 'main'});

var http = require('http');
var io = require('socket.io');

var app = express();
app.engine('handlebars', handlebars.engine);
app.set('views', 'views');
app.set('view engine', 'handlebars');

app.use(AV.Cloud);

app.set('port', process.env.LC_APP_PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.render('home');
});

app.get('/thank-you', function(req, res){
     res.end('thank you');
});

app.get('/getdata', function(req, res){
     if(req.xhr || req.accepts('json,html')==='json'){
         res.send({ success: true });
      } else {
         res.redirect(303, '/thank-you');
      }
});

app.use(function(req, res){
    res.type('text/plain');
    res.status(404);
    res.end('404 not found');
});

var server = http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

io = io.listen(server);

var cache = {};
var users = [];
var dateCache = {
    yestoday: ''
};

io.on('connection', function(socket){
    var today = new Date().getDay();
    if(today !== dateCache.yestoday){
        dateCache.yestoday = today;
        cache = {};
    }
    socket.on('add user', function (data) {
        if(data){
            users.push(data.username);
            socket.emit('login', data);
            socket.emit('update sum cache', cache);
            socket.emit('update user cache', users);
            socket.broadcast.emit('update user', data);
        }
    });

    socket.on('add summary', function(data){
        var id = data.id;
        var content = data.content.replace(/\<|\>|\s/g, function(match){
            switch(match){
                case '<':
                    return '&lt;';
                    break;
                case '>':
                    return '&gt;';
                    break;
                case ' ':
                    return '&nbsp;';
                    break;
                default:
                    return match;
                    break;
            }
        });
        var c = content.split('\n');
        var ret = {
            id: data.id,
            content: c
        };
        if(id && content){
            cache[id] = ret;
            socket.emit('summary added', ret);
            socket.broadcast.emit('update summary', ret);
        }
    });
});