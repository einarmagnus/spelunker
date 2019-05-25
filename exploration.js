const fetch = require("node-fetch");

/** this is how I first established that we can trick it with branching */
async function cookieExploration() {
    let url = "https://newrainsoftware.com/brizzo/blarf"
    let r = await fetch(url);
    let cookie = r.headers.get("Set-Cookie");

    let room = await r.json();
    console.log("entrance", room);
    let path = [
        "15D801C529280C23",
        "5247A0EC35B2AB16",
        "660C81CDDFC5C1E9",
        "DB9F5038A76E9153",
        "E8D794B05F6393A7",
        "D0BE3FAFC1AC19A7",

    ];
    let path2a = [
        "A3AA0C0DD2F7183E",
        "FD856BBE57B448B6",
        "8C3762790861C98E",
    ]
    let path2b = [
        "F99E5612AD4A81CC",
        "9F06FBE4C6DB2588",
    ]
    let next = room.see[0];

    for (let xid of path) {
        r = await fetch(url, {
            method: "put",
            headers: {
                "Content-Type": "application/json",
                "Cookie": cookie
            },
            body: JSON.stringify({ xid })
        })
        cookie = r.headers.get("Set-Cookie");
        console.log("entered", await r.json()); 
    }

    console.log("FORK!")

    let cookies = {a: cookie, b: cookie};

    for (let i = 0; i < 2; i++) {
        let xid1 = path2a[i];
        let xid2 = path2b[i];
        
        r = await fetch(url, {
            method: "put",
            headers: {
                "Content-Type": "application/json",
                "Cookie": cookies.a
            },
            body: JSON.stringify({ xid: xid1 })
        })
        console.log("enteredA", xid1, r.status,  await r.text()); 
        cookies.a = r.headers.get("Set-Cookie");
        r = await fetch(url, {
            method: "put",
            headers: {
                "Content-Type": "application/json",
                "Cookie": cookies.b
            },
            body: JSON.stringify({ xid: xid2 })
        })
        console.log("enteredB", xid2,  r.status, await r.text()); 
        cookies.b = r.headers.get("Set-Cookie");

    }
}

cookieExploration();