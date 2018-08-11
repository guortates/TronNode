var Client = {};
Client.pseudo = "Anonymous";
var arrayOfColors = [0xff0000,0xffbf00,0x80ff00,0x00ffff,0x0040ff,0x8000ff,0xff00bf,0xff4000,0xffff00,0x40ff00,0x00ff80,0x00bfff,0x0000ff,0xbf00ff,0xff0080,0xff8000,0xbfff00,0x00ff00,0x00ffbf,0x0080ff,0x4000ff,0xff00ff,0xff0040];

document.getElementById("connexion").addEventListener("click",function(){
    if(document.getElementById("pseudo").value != ""){
        Client.pseudo = document.getElementById("pseudo").value;
    }
    
    document.getElementById("champ").innerHTML = "";

    Client.socket = io.connect();
    Client.socket.emit('playerConnexion',Client.pseudo);
    Client.okright = true;
    Client.okleft = true;

    Client.socket.on('currentGameState',function(width,height,players,id){
        Client.game = new TronGame(width,height,players);
        Client.id = id;
        Client.player = Client.game.getPlayer(Client.id);
        
        for(var i=0;i<players.length;i++){
            addScore(players[i]);
        }
        
        document.onkeydown = function(e) {
            var event = window.event ? window.event : e;
            if (event.keyCode == 37 && Client.okleft) {
                Client.okleft = false;
                Client.socket.emit("askChange",true,Client.id);
            }
            else if (event.keyCode == 39 && Client.okright) {
                Client.okright = false;
                Client.socket.emit("askChange",false,Client.id);
            }
            else if(event.keyCode == 38){
                Client.socket.emit("askAcc");
            }
        };
        
        document.onkeyup = function(e){
            var event = window.event ? window.event : e;
            if (event.keyCode == 37) { Client.okleft = true; }
            else if (event.keyCode == 39) { Client.okright = true; }
        }

        Client.socket.on('newChange',function(x,y,vx,vy,id){
            Client.game.newChange(vx,vy,id,x,y);
        });

        Client.socket.on('newPos',function(id,x,y){
            Client.game.setPos(id,x,y);
        });

        Client.socket.on('newPlayer',function(pl){
            addScore(pl);
            Client.game.addPlayer(pl.pseudo,pl.ip,pl.port,pl.id,pl.x,pl.y,pl.vx,pl.vy); 
        });
        
        function addZero(str){
            var diff = 6-str.length;
            for(var i=0;i<diff;i++){
                str = "0"+str;
            }
            
            return str;
        }
        
        function addScore(pl){
            document.getElementById("ranking").innerHTML += "<li id='total"+pl.id+"' style=\"color: #"+addZero(arrayOfColors[pl.id%arrayOfColors.length].toString(16).replace("0x",""))+"\">"+pl.pseudo+" : <span id='score"+pl.id+"'>"+pl.score+"</span></li>";
        }
        
        function updateScore(pl){
            document.getElementById("score"+pl.id).innerHTML = pl.score;
        }

        Client.socket.on('death', function(id){
           Client.game.deletePlayer(id); 
            document.getElementById('ranking').removeChild(document.getElementById("total"+id));
        });

        Client.socket.on('respawn', function(pl,killer){
            var pl1= Client.game.getPlayer(pl.id);
            pl1.points = pl.points;
            pl1.x = pl.x;
            pl1.y = pl.y;
            pl1.vx = pl.vx;
            pl1.vy = pl.vy;
            pl1.score = pl.score;
            updateScore(pl1);
            
            if(killer != undefined){ // si pas le mur
                var plK = Client.game.getPlayer(killer.id);
                plK.score = killer.score;
                updateScore(plK);
            }
        });

        window.addEventListener("beforeunload", function (event) {
            Client.socket.emit('disconnexion');
        });

        var GraphicEngine = {};

        GraphicEngine.init = function(){
            graphicEngine.stage.disableVisibilityChange = true;
        };

        GraphicEngine.preload = function() {
                // load the images
                /*game.load.tilemap('map', 'assets/map/example_map.json', null, Phaser.Tilemap.TILED_JSON);
                game.load.spritesheet('tileset', 'assets/map/tilesheet.png',32,32);
                game.load.image('sprite','assets/sprites/sprite.png');
                game.load.image('barre','assets/sprites/barre.png');*/
        };

        GraphicEngine.create = function(){
            var graphics = graphicEngine.add.graphics(0, 0);
            window.graphics = graphics;

            window.count1 = 0
        };

        GraphicEngine.update = function(){ // voir si ligne pas refaite a chaque fois car trop long a charger
            var graphics = window.graphics;
            if(window.count1%10 == 0){ // avoid blinking
                graphics.clear();
            }

            Client.game.getCurrentGameState().forEach(function(el){
                graphics.lineStyle(1, arrayOfColors[el.id%arrayOfColors.length], 1);
                graphics.moveTo(el.points[0].x, el.points[0].y);
                for(var i=1;i<el.points.length;i++){
                    graphics.lineTo(el.points[i].x, el.points[i].y);
                }

                graphics.lineTo(el.x,el.y);
            }); 
            window.count1++;
        };

        var graphicEngine = new Phaser.Game(width, height, Phaser.AUTO, document.getElementById('game'));
        graphicEngine.state.add('GraphicEngine',GraphicEngine);
        graphicEngine.state.start('GraphicEngine');
    });
});