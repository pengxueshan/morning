var AV = require('leanengine');
var APP_ID = process.env.LC_APP_ID;
var APP_KEY = process.env.LC_APP_KEY;
var MASTER_KEY = process.env.LC_APP_MASTER_KEY;
AV.initialize(APP_ID, APP_KEY, MASTER_KEY);

var Post = AV.Object.extend('Post');

var express = require('express');
var handlebars = require('express3-handlebars').create({defaultLayout: 'main'});

var http = require('http');
var io = require('socket.io');
var fs = require('fs');

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

var users = [];
// var dateCache = {
//     yestoday: ''
// };

io.on('connection', function(socket){
    // var today = (new Date()).getDay();
    // if(today !== dateCache.yestoday){
    //     dateCache.yestoday = today;
    // }
    socket.on('add user', function (data) {
        if(data){
            if(users.indexOf(data.username) == -1){
                users.push(data.username);
            }
            socket.emit('login', data);
            getAllData(socket);
            // socket.emit('update sum cache', cache);
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
        saveData(id, c, socket);
        // var ret = {
        //     id: data.id,
        //     content: c
        // };
        // if(id && content){
        //     cache[id] = ret;
        //     socket.emit('summary added', ret);
        //     socket.broadcast.emit('update summary', ret);
        // }
    });
});

var saveData = function(id, data, socket){
    var c = data.join('\r\n');
    var post = new Post();
    post.set('username', id);
    post.set('content', c);
    post.set('key', 'mxdMorning');
    post.save().then(function(post) {
      // 成功保存之后，执行其他逻辑.56eabb26efa6310054552e50
      console.log('New object created with objectId: ' + post.id);
      getAllData(socket);
    }, function(err) {
      // 失败之后执行其他逻辑
      // error 是 AV.Error 的实例，包含有错误码和描述信息.
      console.log('Failed to create new object, with error message: ' + err.message);
    });
    // var Post = AV.Object.extend('Post');
    // var query = new AV.Query(Post);

    // // 这个 id 是要修改条目的 objectId，你在生成这个实例并成功保存时可以获取到，请看前面的文档
    // query.get('56eabb26efa6310054552e50').then(function(post) {
    //   // 成功，回调中可以取得这个 Post 对象的一个实例，然后就可以修改它了
    //   post.set(id, c);
    //   post.save();
    // }, function(error) {
    //   // 失败了
    // });
    // var file = new AV.File('./users/' + id, new Buffer(c));
    // console.log(file);
    // file.save().then(function(obj) {
    //   // 数据保存成功
    //   getAllData(socket);
    // }, function(err) {
    //   // 数据保存失败
    //   console.log(err);
    // });
    // fs.writeFile('users/' + id, c, function(err){
    //     if(err){
    //         console.log(err);
    //         return;
    //     }
    //     getAllData(socket);
    // });
};

var getAllData = function(socket){
    var query = new AV.Query(Post);
    var ret = {};
    query.equalTo('key', 'mxdMorning');
    query.find().then(function(results) {
      console.log('Successfully retrieved ' + results.length + ' posts.');
      // 处理返回的结果数据
      for (var i = 0; i < results.length; i++) {
        ret[results[i].get('username')] = results[i].get('content');
        // var object = results[i];
        // console.log(object.id + ' - ' + object.get('content'));
      }
      console.log(ret);
      socket.emit('update summary', JSON.stringify(ret));
      socket.broadcast.emit('update summary', JSON.stringify(ret));
    }, function(error) {
      console.log('Error: ' + error.code + ' ' + error.message);
    });
    // fs.readdir('./users/', function(err, files){
    //     if(err){
    //         console.log(err);
    //         return;
    //     }

    //     var count = files.length;
    //     var ret = {};
    //     files.forEach(function(filename){
    //         fs.readFile('./users/' + filename, 'utf8', function(err, data){
    //             ret[filename] = data;
    //             count--;
    //             if(count <= 0){
    //                 socket.emit('update summary', JSON.stringify(ret));
    //                 socket.broadcast.emit('update summary', JSON.stringify(ret));
    //             }
    //         });
    //     });
    // });
};

// (function delFile(){
//     var time = new Date();
//     var curH = time.getHours();
//     if(curH > 21){
//         fs.readdir('./users/', function(err, files){
//             files.forEach(function(filename){
//                 fs.unlinkSync('./users/' + filename);
//             });
//         });
//     }else{
//         setTimeout(delFile, 60 * 60 * 1000);
//     }
// })();