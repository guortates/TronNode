var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var Game = require('./js/Game');

// paths definition
app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

// template system for the index.html
app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

// constants
server.playersId = 0;
server.height = 500;
server.width = 500;
server.speedMax = 1;
server.game = new Game(server.width,server.height);

// listening on port 8081
server.listen(process.env.PORT || 8081,function(){
    
});

// websocket init
io.on('connection',function(socket){
    var id;
    var interval;
    socket.on('playerConnexion',function(pseudo){
        var pl = server.game.addPlayer(pseudo,socket.handshake.address,socket.handshake.port,server.playersId);
        id = pl.id;
        server.playersId++;
        
        console.log("New player : "+pseudo+"@"+socket.handshake.address+":"+socket.handshake.port);
        
        socket.broadcast.emit('newPlayer',pl);
        socket.emit('currentGameState',server.width,server.height,server.game.getCurrentGameState(),pl.id);
    
        interval = setInterval(function(){            
            // compute the collisions and send the right respawn or else do the other things (don't forget to update the server score too)
            var dead = false;
            var current;
            
            if(pl.acc >= 0){
                if(pl.acc >= 30 && pl.acc < 100){
                    if(pl.vx != 0){
                        pl.vx = pl.vx/Math.abs(pl.vx);
                    }
                    if(pl.vy != 0){
                        pl.vy = pl.vy/Math.abs(pl.vy);
                    }
                    pl.acc++;
                }
                else if(pl.acc >= 100){
                    pl.acc = -1;
                }
                else {
                    pl.acc++
                }
            }
            
            for(var i=0;i<server.game.players.length;i++){
                current = server.game.players[i];
                var act;
                var nxt = current.points[0];
                for(var j=0;j<current.points.length-1;j++){
                    act = current.points[j];
                    nxt = current.points[j+1];
                    if(act.x == nxt.x && ((pl.x < act.x && pl.x+pl.vx >= act.x) || (pl.x > act.x && pl.x+pl.vx <= act.x)) && pl.y >= Math.min(act.y,nxt.y) && pl.y <= Math.max(act.y,nxt.y)) {
                        dead = true;
                        break;
                    }
                    else if(act.y == nxt.y && ((pl.y < act.y && pl.y+pl.vy >= act.y) || (pl.y > act.y && pl.y+pl.vy <= act.y)) && pl.x >= Math.min(act.x,nxt.x) && pl.x <= Math.max(act.x,nxt.x)) {
                        dead = true;
                        break;
                    }
                }
                
                if(nxt.x == current.x && ((pl.x < nxt.x && pl.x+pl.vx >= nxt.x) || (pl.x > nxt.x && pl.x+pl.vx <= nxt.x)) && pl.y >= Math.min(current.y,nxt.y) && pl.y <= Math.max(current.y,nxt.y)) {
                    dead = true;
                }
                else if(nxt.y == current.y && ((pl.y < nxt.y && pl.y+pl.vy >= nxt.y) || (pl.y > nxt.y && pl.y+pl.vy <= nxt.y)) && pl.x >= Math.min(current.x,nxt.x) && pl.x <= Math.max(current.x,nxt.x)) {
                    dead = true;
                }
                
                if(dead){
                    break;
                }
            }
            
            if(dead){
                server.game.respawn(id);
                pl.score--;
                if(pl.id != current.id){
                    current.score += 2;
                }
                socket.emit('respawn',pl,current);
                socket.broadcast.emit('respawn',pl,current);
            }
            else {
                pl.x += pl.vx;
                pl.y += pl.vy;

                if(pl.x < 0 || pl.x > server.width || pl.y < 0 || pl.y > server.height){
                    server.game.respawn(id);
                    pl.score--;
                    socket.emit('respawn',pl,undefined);
                    socket.broadcast.emit('respawn',pl,undefined);
                }
                else {
                    socket.broadcast.emit('newPos',pl.id,pl.x,pl.y);
                    socket.emit('newPos',pl.id,pl.x,pl.y);
                }
            }
        },50);
    });
    
    socket.on('askChange',function(left,id){
        var vx = 0;
        var vy = 0;
        var pl = server.game.getPlayer(id);
        if(left){
            if(pl.vx == 0){
                vx = pl.vy;
            }
            else {
                vy = -pl.vx;
            }
        }
        else {
            if(pl.vx == 0){
                vx = -pl.vy;
            }
            else {
                vy = pl.vx;
            }
        }
        
        console.log("Change asked : "+vx+";"+vy+";"+id);
        var coor = server.game.newChange(vx,vy,id); 
        socket.broadcast.emit('newChange',coor.x,coor.y,vx,vy,id);
        socket.emit('newChange',coor.x,coor.y,vx,vy,id);
    });
    
    socket.on('askAcc',function(){
        var pl = server.game.getPlayer(id);
        if(pl.acc == -1){
            pl.acc = 0;
        }
        if(pl != undefined && pl.acc < 30){
            if(pl.vx != 0){
                pl.vx = pl.vx/Math.abs(pl.vx)*Math.min(Math.abs(pl.vx)+0.15,5);
            }
            if(pl.vy != 0){
                pl.vy = pl.vy/Math.abs(pl.vy)*Math.min(Math.abs(pl.vy)+0.15,5);
            }
        }
    })
    
    socket.on('disconnect',function(){
        clearInterval(interval);
        server.game.deletePlayer(id);
        socket.broadcast.emit('death',id);
    });
});
