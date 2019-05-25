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
 * Make a visualizer of found rooms.
 * Returns a function to be called with a found room which will be drawn.
 * 
 * @param {number} initialScale the scale to start with
 * @returns {(Room) => ()}
 */
function Visualizer(initialScale = 1000) {
    let width = 1000;
    let height = 1000;
    /**
     * Clear the body of the page and insert a canvas.
     * Returns the rendering context for the canvas
     * @returns {CanvasRenderingContext2D}
     */
    function setupUI() {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.overflow= "hidden";
            
        document.body.innerHTML = `
            <canvas width="1" height="1" style="margin: auto; width:100vw; height: 100vh; padding: 0">
        `;
        const canvas = document.querySelector("canvas");
        canvas.width =  width = document.body.scrollWidth - 5;
        canvas.height = height = document.body.scrollHeight - 5;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        
        return canvas.getContext("2d");        
    }
    let ctx = setupUI();

    let rooms = {
        /** @type {Room[]} */
        all: [],
        /** @type {{[xid: string]: Room}} */
        byId: {}
    };
    /** the largest x-value found of a room's position */
    let maxWidth = 1;
    /** the largest y-value found of a room's position */
    let maxHeight = 1;
    let scale = initialScale;
    /** The scale is adjusted in steps to avoid redrawing the while field 
     *  too often, this is the size of those steps
     */
    let scaleStep = 1;

    /**
     * A function that takes a room and draws it
     * @param {Room} room 
     */
    function enteredRoom(room) {
        rooms.all.push(room);
        rooms.byId[room.xid] = room;
        let {x, y} = room.pos;
        if (x > maxWidth) { maxWidth = x; }
        if (y > maxHeight) { maxHeight = y; }
        draw(room);
    }
    return enteredRoom;
    
    /**
     * Draws a room and makes sure the scale is right to fit all drawn rooms
     * If the room won't fit, the scale wil be adjusted and all previously 
     * drawn rooms will be redrawn
     * @param {Room} room 
     */
    function draw(room) {
        
        ctx.save();
        let size = Math.min(width / (maxWidth + 1), height / (maxHeight + 1));
        
        // if the scale is already good, just draw the room
        if (size >= scale) {
            ctx.scale(scale, scale);
            drawRoom(room);
            ctx.restore();
            return;
        }
        // if the scale needs changing, change it and redraw everything
        scale = Math.max(Math.floor(size / scaleStep) * scaleStep, 1);
        ctx.clearRect(0, 0, width, height);
        ctx.scale(scale, scale);
        rooms.all.forEach(drawRoom);
        ctx.restore();
    }

    /**
     * Draw a room at the current scale
     * Also draws the connections between all found rooms
     * @param {Room} room 
     */
    function drawRoom(room) {
        let {col, see, pos: {x, y}} = room;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(x, y, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();
        room.drawn = scale;
        see.forEach(nid => {
            let neighbor = rooms.byId[nid];
            // redraw connection to neighbour if the neighbour 
            // exists && it was already drawn at this scale
            if (neighbor && neighbor.drawn === scale) {
                drawConnections({x, y}, neighbor.pos);
            }   
        });
    }

    /**
     * Draw a connection between two points
     * @param {{x: number, y: number}} p1 the first point
     * @param {{x: number, y: number}} p2 the second point 
     */
    function drawConnections({x, y}, {x: nx, y: ny}) {
        // find distance between two points
        let length = Math.sqrt((x - nx)**2 + (y - ny)**2);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.atan2(ny - y, nx - x));
        ctx.lineWidth = 0.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(length, 0);
        ctx.strokeStyle = "#ff000050";        
        ctx.stroke();
        ctx.restore();
    }
}
