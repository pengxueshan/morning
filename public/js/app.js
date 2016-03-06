;$(function(){
    //socket
    (function(){
        var socket = io();
        var USERNAME;
        var summary = $('.summary');

        socket.on('update user', function (data) {
            updateUser(data.username);
        });

        socket.on('login', function (data) {
            if(data){
                $('.login-layer').hide();
                $('.users').append('<p><span>'+ data.username +' has login.</span></p>');
            }
        });

        socket.on('update sum cache', function (data) {
            if(data){
                for(var key in data){
                    updateSum(data[key]);
                }
            }
        });

        socket.on('update user cache', function (data) {
            if(data){
                data.forEach(function(ele, index){
                    updateUser(ele);
                });
            }
        });

        socket.on('summary added', function (data) {
            updateSum(data);
        });

        socket.on('update summary', function (data) {
            updateSum(data);
        });

        function updateSum(data){
            var sum = $('#' + data.id);
            var html = '';
            data.content.forEach(function(ele, index){
                html += '<p>'+ ele +'</p>';
            });
            if(sum.length > 0){
                sum.find('.c').html(html);
            }else{
                summary.append('<div class="item" id="'+ data.id +'"><p class="u">'+ data.id +'</p><div class="c">'+ html +'</div></div>');
            }
        }

        function updateUser(username){
            $('.users').append('<p><span>'+ username +' online.</span></p>');
        }

        $(document).on('click', '.login-layer .btn', function(){
            USERNAME = $('.login-layer input').val();
            localStorage.setItem('mxdMorningUsername', USERNAME);
            socket.emit('add user', {username: USERNAME});
        });

        $(document).on('click', '.commit', function(){
            var content = $('.content').val();
            socket.emit('add summary', {id: USERNAME, content: content});
        });

        (function(){
            var username = localStorage.getItem('mxdMorningUsername');
            console.log(username);
            if(username){
                $('.login-layer').hide();
                USERNAME = username;
                socket.emit('add user', {username: USERNAME});
            }
        })();
    })();
})