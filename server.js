let fs = require("fs");
var express =  require("express");
var app = express();

app.use(express.static("public"));

app.get("/",function(req,res){
    res.send("Hello");
});

var https = require("https");

var serverOptions = {
    key: fs.readFileSync("local.key"),
    cert: fs.readFileSync("local.cer"),
};

var httpsServer = https.createServer(serverOptions,app);

httpsServer.listen(443,()=>{
    console.log('HTTPS listening on PORT 443');
});

let peers =  {};

var io = require("socket.io")().listen(httpsServer);

io.sockets.on("connection",(socket)=>{
    peers[socket.id] = socket;
    console.log("We have a new client:"+ socket.id);

    socket.on("list",()=>{
        let ids =  Object.keys(peers);

        console.log("ids length"+ ids.length);
        socket.emit('listresults',ids);
    });
    
    socket.on("signal",(to,from,data)=>{
        console.log("signal",to,data);
        if(to in peers){
            peers[to].emit("signal",to,from,data);
        }else{
            console.log("Peer not found!");
        }
    });

    socket.on("disconnect",()=>{
        console.log("Client has disconnected"+socket.id);
        io.emit("peer_disconnect",socket.id);
        delete peers[socket.id];
    });
});
