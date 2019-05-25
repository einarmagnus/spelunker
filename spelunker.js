const fetch = require("node-fetch");
/**
 * A position with x and y values
 * @typedef {Object} Pos
 * @property {number} x the x position
 * @property {number} y the y position  
 */
/**
 * A Room to be visualized
 * @typedef {Object} Room
 * @property {string} xid the id of this room
 * @property {string} col the color of this room in html hex form
 * @property {Pos} pos The position of the rooom
 * @property {string[]} see an array of XIDs pointing to this room's neighbours
 *  
 */

 /**
  * Start a spelunker exploring the labyrinthine message of the given name.
  * Whenever a new room is found the `roomFound` method will be called with it.
  * 
  * It turns out the server does not use the cookie we get to kep state but only to see where 
  * last came from. Thus we can cheat by splitting into multiple spelunkers in 
  * every fork of the road and just serve the cookie from the last room we came from
  * 
  * @param {string} name the name of the message
  * @param {(Room) => {}} roomFound a function that will be called whenever a new room is found 
  */
function spelunker(name = "blarf", roomFound = console.log) {
    let abortExploration = false;

    const promise = new Promise((done, error) => {
        // I want to use async/await
        wrapper();
        async function wrapper() {

            /** Keeping track of all open requests to know when we are done */
            let openRequests = 0;

            const url = "https://newrainsoftware.com/brizzo/" + name;

            /**
             * Keep track of where we've already spelunked  
             * @type {[xid: string]: boolean} 
             */
            let map = {};
            map.has = xid => map[xid];
            map.add = room => map[room.xid] = true;

            // GET the entrance
            const result = await fetch(url,  {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (result.status !== 200) {
                error(new Error(result.statusText));
                return;
            }
            const entrance = await result.json(); 
            // declare we've found a room!
            roomFound(entrance);
            const cookie = result.headers.get("Set-Cookie");
            // explore in all directions!
            entrance.see.forEach(xid => explore(xid, cookie));

            /**
             * PUT the xid of the room we want to look into, we'll get att it's details as the response
             * @param {string} xid the xid of the room to PUT 
             * @param {string} cookie the cookie of the previous room (this is where we sneakily cheat)
             */
            async function put(xid, cookie) {
                openRequests++;
                try {
                    const result = await fetch(url, {
                        body: JSON.stringify({ xid }),
                        headers: {
                            'Content-Type': 'application/json',
                            cookie,
                        },
                        method: "put",
                    });
                    if (result.status === 200) {
                        return { 
                            room: await result.json(), 
                            cookie: result.headers.get("Set-Cookie"),
                        };
                    } else {
                        return {
                            error: true, 
                            status: result.status, 
                            statusText: result.statusText,
                        };
                    }
                } catch (e) {
                    return { 
                        error: true, 
                        status: 499, 
                        statusText: e.message,
                    };
                } finally {
                    openRequests--;
                }
            }

            /**
             * This function looks into a new room and then recursivly explores all its 
             * neighbouring rooms.
             * @param {string} xid the xid of the room to explore
             * @param {string} prevCookie the cookie from the previous room
             */
            async function explore(xid, prevCookie) {
                if (map.has(xid)) {
                    // already been here
                    return;
                }
                let {cookie, room, statusText} = await put(xid, prevCookie);
                // if we got an error we print it and exit this branch
                if (statusText) {
                    console.log("Error PUTting", {xid, statusText, cookie});
                    return;
                }
                // declare that we fond a new room!
                roomFound(room);
                map.add(room);
                // if we've been asked to abort the exploration, 
                // don't go into any new rooms
                if (!abortExploration) {
                    room.see.forEach(r => explore(r, cookie));
                }
                // if there are no longer any connections open, 
                // then we're done spelunking
                if (openRequests === 0) {
                    done();
                }
            }
        }
    });
    promise.abortExploration = () => abortExploration = true;
    return promise;
}

module.exports = spelunker;