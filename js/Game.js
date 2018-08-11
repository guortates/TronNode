var module = module || {};

class Player {
    constructor(pseudo,ip,port,x,y,vx,vy,points,id,score=0){
        this.pseudo = pseudo;
        this.ip = ip;
        this.port = port;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.points = points;
        this.id = id;
        this.score = score;
        this.acc = -1;
    }
}

class TronGame {
    constructor(width,height,players=[]){
        this.width = width;
        this.height = height;
        this.players = players;
    }

    addPlayer(pseudo,ip,port,id,x=-1,y=-1,vx=-1,vy=-1){
        if(x == -1 || y == -1){
            x = this.getRandomInt(0,this.width);
            y = this.getRandomInt(0,this.height);
            
            vx = 0;
            vy = 0;
            if(this.getRandomInt(0,1) == 0){
                vx = this.getRandomInt(0,1)*2-1;
            }
            else {
                vy = this.getRandomInt(0,1)*2-1;
            }
            
        }

        var pl = new Player(pseudo,ip,port,x,y,vx,vy,[{x: x,y: y}],id);
        this.players.push(pl);
        return pl;
    }
    
    setPos(id,x,y){
        var pl = this.getPlayer(id);
        pl.x = x;
        pl.y = y;
    }
    
    newChange(vx,vy,id,x=-1,y=-1){
        var pl = this.getPlayer(id);
        if(pl != undefined){
            if(x == -1 && y == -1){
                x = pl.x;
                y = pl.y;
            }
            pl.points.push({x:x,y:y});
            pl.x = x;
            pl.y = y;
            pl.vx = vx;
            pl.vy = vy;
        }
        
        return {x:x,y:y};
    }
    
    respawn(id){
        var pl = this.getPlayer(id);
        var x = this.getRandomInt(0,this.width);
        var y = this.getRandomInt(0,this.height);
            
        var vx = 0;
        var vy = 0;
        if(this.getRandomInt(0,1) == 0){
            vx = this.getRandomInt(0,1)*2-1;
        }
        else {
            vy = this.getRandomInt(0,1)*2-1;
        }
        
        pl.x = x;
        pl.y = y;
        pl.points = [{x:x,y:y}];
        pl.vx = vx;
        pl.vy = vy;
    }
    
    deletePlayer(id){ // delete the player with splice and then we need to delete it on the client too (handle event) + TODO collisions and respawn + colors
        var i;
        for(i = 0;i<this.players.length;i++){
            if(id == this.players[i].id){
                break;
            }
        }
        
        this.players.splice(i,1);
    }
    
    getPlayer(id){
        for(var i = 0;i<this.players.length;i++){
            if(id == this.players[i].id){
                return this.players[i];
            }
        }
        return undefined;
    }

    getRandomInt(min,max) {
        return Math.floor(min)+Math.floor(Math.random() * (Math.floor(max-min)+1));
    }

    getCurrentGameState(){
        return this.players;
    }
    
    update() {
        this.players.forEach(function(pl){
            pl.x += pl.vx;
            pl.y += pl.vy;
        }) 
    }
}

module.exports = TronGame;