const express = require("express");
const app = express();
const spelunker = require("./spelunker");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");

app.use(express.static("public"));

app.get("/explore/:name", async (req, res) => {
    res.sendFile("public/explore.html", {root: __dirname});
});

app.post("/create", bodyParser.urlencoded({extended: false}), async (req, res) => {
    let {name, message, shape, seed} = req.body;
    if (!name || name.trim() === "" || !message || message.trim() === "") {
        res.status(400).send("You must enter both a name and a message. Go back.");
        return;
    }
    const r = await fetch("https://newrainsoftware.com/brizzo/", {
        method: "post",
        headers: {
            'Content-Type': "application/json",
        },
        body: JSON.stringify({
            name,
            text: message,
            shape: shape || "hex",
            seed: +seed || 123,
        })
    });
    if (Math.floor(r.status / 100) === 2) {
        res.redirect("/explore/" + name);
    } else {
        let text = await r.text();
        console.log(new Date(), "error", r.status, text);
        res.send(text);
    }
});

app.get("/explore/:name/stream", async (req, res) => {
    let {name} = req.params;
    console.log(new Date(), "started exploration of", name);
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });
    res.write("\n");
    try {
        const explorer = spelunker(name, relayRoom);
        
        let id = 0;
        function relayRoom(room) {
            res.write(`data: ${JSON.stringify(room)}\n`);
            res.write("\n");
        }
        res.on("close", explorer.abortExploration);
        await explorer;
        res.write("\nevent: done\n");
        res.write("data: plz close connection\n");
        res.write("\n");
        console.log(new Date(), `Closing exploration of ${name}`);
        res.end()
    } catch (e) {
        console.log(new Date(), `Error, closing exploration of ${name}, ${e.message}`);
        res.write("\nevent: error\n");
        res.write("data: no such message\n");
        res.write("\n");
        res.end()
    }
});

if (process.argv[1] === __filename) {
    app.listen(3003, () => console.log("look at exploration at http://localhost:3003"));
}