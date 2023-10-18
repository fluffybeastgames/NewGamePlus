'use strict'
const RENDER_REFRESH_TIME = 16; // time in ms to wait after rendering before rendering. Due to how setTimeout works, may be up to 16 ms late
let game;
let pressedKeys = {};

function loadApp() {
    console.log('loadApp() called');   

    let gameDiv = document.getElementById('game_div');

    let canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    canvas.width = 1000;
    canvas.height = 700;
    canvas.style.border = '2px solid black';
    canvas.style.position = 'absolute'; 
    canvas.style.zIndex = '-1'; // set to a low z index to make overlapping elements cover the canvas
    
    gameDiv.appendChild(canvas);

    window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
    window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }
    
    game = new NewGamePlus(canvas);
}

class GameEntity {
    constructor(context, type, x, y, color) {
        this.context = context;
        this.type = type;
        this.x = x;
        this.y = y;
        this.color = color;

        this.v_x = 0; // velocity
        this.v_y = 0;
        
        this.acc_x = 0; // acceleration
        this.acc_y = 0;
        
        this.max_v_x = 4;
        this.max_v_y = 4;
        
        this.max_acc_x = 1;
        this.max_acc_y = 1;

        // max_v_x, max_v_y, max_acc_x, max_acc_y
    }
}

class Square extends GameEntity {
    constructor(context, x, y, width, height, color) {
        super(context, 'square', x, y, color);
        
        this.width = width;
        this.height = height;
        
    }

    update_position(timePassed) {
        // this.x += this.vx * timePassed;
        // this.y += this.vy * timePassed;

        this.x += this.v_x;
        this.y += this.v_y;
            
        this.v_x += this.acc_x;
        this.v_y += this.acc_y;
        
        this.v_x *= .99; // drag
        this.v_y *= .99; // drag
        

        if(this.v_x > this.max_v_x) {
            this.v_x = this.max_v_x;
        } else if(this.v_x < -this.max_v_x) {
            this.v_x = -this.max_v_x;
        }

        if(this.v_y > this.max_v_y) {
            this.v_y = this.max_v_y;
        } else if (this.v_y < -this.max_v_y) {
            this.v_y = -this.max_v_y;
        }

        // Wall bounce check
        this.bouncy_wall_check();
    }

    draw() {
        this.context.fillStyle = this.color;
        this.context.fillRect(this.x, this.y, this.width, this.height);
        
    }

    bouncy_wall_check() {
        if (this.x < 0) {
            this.x = 0;
            this.v_x *= -.5;
            this.acc_x *= -.2;
        }
        if (this.x + this.width > game.canvas.width) {
            this.x = game.canvas.width - this.width;
            this.v_x *= -.5;
            this.acc_x *= -.2;
        }
        if (this.y < 0) {
            this.y = 0;
            this.v_y *= -.5;
            this.acc_y *= -.2;
        }
        if (this.y + this.height > game.canvas.height) {
            this.y = game.canvas.height - this.height;
            this.v_y *= -.5;
            this.acc_y *= -.2;
        }

    }
    
}


class Circle extends GameEntity {
    constructor(context, x, y, diameter, color) {
        super(context, 'circle', x, y, color);
        
        this.diameter = diameter;        
        this.radius = diameter/2;
    }

    update_position(timePassed) {
        // this.x += this.vx * timePassed;
        // this.y += this.vy * timePassed;

        this.x += this.v_x;
        this.y += this.v_y;
            
        this.v_x += this.acc_x;
        this.v_y += this.acc_y;
        
        this.v_x *= .995; // drag
        this.v_y *= .995; // drag
        

        if(this.v_x > this.max_v_x) {
            this.v_x = this.max_v_x;
        } else if(this.v_x < -this.max_v_x) {
            this.v_x = -this.max_v_x;
        }

        if(this.v_y > this.max_v_y) {
            this.v_y = this.max_v_y;
        } else if (this.v_y < -this.max_v_y) {
            this.v_y = -this.max_v_y;
        }

        this.bouncy_wall_check();
    }

    draw() {
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.diameter/2, 0, 2 * Math.PI, false);
        this.context.fillStyle = this.color;
        this.context.fill();
        this.context.lineWidth = 1;
        this.context.strokeStyle = '#003300';
        this.context.stroke();
    }

    bouncy_wall_check() {
        if (this.x < this.radius) {
            this.x = this.radius;
            this.v_x *= -.5;
            this.acc_x *= -.2;
        }
        if (this.x + this.radius > game.canvas.width) {
            this.x = game.canvas.width - this.radius;
            this.v_x *= -.5;
            this.acc_x *= -.2;
        }
        if (this.y < this.radius) {
            this.y = this.radius;
            this.v_y *= -.5;
            this.acc_y *= -.2;
        }
        if (this.y + this.radius > game.canvas.height) {
            this.y = game.canvas.height - this.radius;
            this.v_y *= -.5;
            this.acc_y *= -.2;
        }
    }
    
}


class NewGamePlus {
    constructor(canvas) {        
        this.id = -1;
        this.canvas = canvas;
        let context = canvas.getContext('2d');

        this.entities = [];
        this.entities.push(new Circle(context, 0, 0, 25, '#DD0000'));
        // this.entities.push(new Square(context, 0, 0, 20, 20, '#DD0000'));
        this.entities.push(new Square(context, 0, 50, 50, 50, '#BBFF00'));
        this.entities.push(new Square(context, 25, 175, 25, 25, '#0000BB'));
        this.entities.push(new Square(context, 500, 200, 25, 25, '#0000BB'));
        this.entities.push(new Square(context, 200, 300, 250, 10, '#0000BB'));
        this.entities.push(new Square(context, 500, 300, 50, 50, '#00BB00'));
        this.entities.push(new Circle(context, 500, 100, 15, '#00BBBB'));
        this.entities.push(new Circle(context, 500, 200, 25, '#00BBBB'));
        this.entities.push(new Circle(context, 500, 300, 35, '#00BBBB'));
        this.entities.push(new Circle(context, 500, 400, 45, '#00BBBB'));
        this.entities.push(new Circle(context, 500, 500, 55, '#00BBBB'));
        this.entities.push(new Circle(context, 0, 200, 15, '#444444'));
        this.entities.push(new Circle(context, 0, 250, 15, '#444444'));
        this.entities.push(new Circle(context, 0, 300, 15, '#444444'));
        
        this.entities[0].v_x = 1;
        this.entities[0].v_y = 1;
        this.entities[0].acc_x = .05;
        this.entities[0].acc_y = .05;

        this.entities[1].v_x = 1;
        this.entities[1].v_y = 1;
        this.entities[1].acc_x = .025;
        this.entities[1].acc_y = .025;

        this.entities[2].v_x = 0;
        this.entities[2].v_y = 0;
        this.entities[2].acc_x = 0;
        this.entities[2].acc_y = 0;

        this.entities[3].v_x = 1;
        this.entities[3].v_y = -1;
        this.entities[3].acc_x = -.05;
        this.entities[3].acc_y = .01;
        
        this.entities[5].acc_y = 1;
        this.entities[5].acc_x = .01;
        
        this.entities[6].v_y = 0;
        this.entities[6].acc_y = 0;

        this.entities[11].v_y = .5;
        this.entities[12].v_y = .75;
        this.entities[13].v_y = 1;
        
        
        
    }
}

function pause_game() {
    console.log('pause_game() called');
}

function startGame() {
    console.log('startGame() called');
}

function endGame() {
    console.log('endGame() called');
}


function game_loop_client() {
    if (true) {
        // get user input
        process_user_input();

        // game logic 
        
        // positional logic
        positional_logic_update();

        // collision detection
        let collisions = collision_detection_update();

        // collision resolution
        if (collisions.length > 0) {
            resolve_collisions(collisions);
        }

        // render
        render_board(); // Redraw the game canvas        
    }
    setTimeout( () => { window.requestAnimationFrame(() => game_loop_client()); }, RENDER_REFRESH_TIME) // therefore each game loop will last at least tick_time ms    
}

function process_user_input() {
    // TODO
    // console.log('user input')
    // console.log(pressedKeys)
    // WASD are 87, 65, 83, 68
    // Arrow keys are 38, 37, 40, 39
    // Space is 32
    // Enter is 13
    // Escape is 27
    // Backspace is 8
    // Delete is 46
    // Tab is 9
    // Shift is 16
    // Ctrl is 17
    // Alt is 18
    game.entities[0].acc_x = 0;
    game.entities[0].acc_y = 0;
    
    if (pressedKeys[87] | pressedKeys[38]) { // W | Up
        game.entities[0].acc_y = -.05;
    }
    if (pressedKeys[65] | pressedKeys[37]) { // A | Left
        game.entities[0].acc_x = -.05;
    }
    if (pressedKeys[83] | pressedKeys[40]) { // S | Down
        game.entities[0].acc_y = .05;
    }
    if (pressedKeys[68] | pressedKeys[39]) { // D | Right
        game.entities[0].acc_x = .05;
    }



}


function positional_logic_update() {
    // Update the position of each entity
    console.log('positional_logic_update() called');
    
    game.entities.forEach(entity => {
        entity.update_position(1)
    });

}

function check_if_collision(entity1, entity2) {
    if (entity1.type == 'square' && entity2.type == 'square') {
        return square_collision_check(entity1, entity2);
    } else if (entity1.type == 'circle' && entity2.type == 'circle') {  
        return circle_collision_check(entity1, entity2);
    } else if (entity1.type == 'circle' && entity2.type == 'square') {
        return circle_rectangle_collision_check(entity1, entity2);
    } else if (entity1.type == 'square' && entity2.type == 'circle') {
        return circle_rectangle_collision_check(entity2, entity1);
    } else {
        return false;
    }
}

function square_collision_check(entity1, entity2) {

    let l1 = entity1.x;
    let t1 = entity1.y;
    let r1 = entity1.x + entity1.width;
    let b1 = entity1.y + entity1.height;

    let l2 = entity2.x;
    let t2 = entity2.y;
    let r2 = entity2.x + entity2.width;
    let b2 = entity2.y + entity2.height;

    if (b1 < t2 || t1 > b2 || r1 < l2 || l1 > r2) {
        return false;
    } else {
        return true;
    }
}


function circle_collision_check(entity1, entity2) {

    // Calculate the distance between the two circles
    let squareDistance = (entity1.x-entity2.x)**2 + (entity1.y-entity2.y)**2;

    // When the distance is smaller or equal to the sum
    // of the two radius, the circles touch or overlap
    return squareDistance <= (entity1.diameter/2 + entity2.diameter/2)**2;
}

function circle_rectangle_collision_check(circle, rectangle) {
    let distance_x = Math.abs(circle.x - (rectangle.x + rectangle.width/2));
    let distance_y = Math.abs(circle.y - (rectangle.y + rectangle.height/2));

    if (distance_x > (rectangle.width/2 + circle.radius)) { return false; }
    if (distance_y > (rectangle.height/2 + circle.radius)) { return false; }

    if (distance_x <= (rectangle.width/2)) { return true; } 
    if (distance_y <= (rectangle.height/2)) { return true; }

    let distance_corner = (distance_x - rectangle.width/2)**2 + (distance_y - rectangle.height/2)**2;

    return (distance_corner <= (circle.radius**2));
}

function collision_detection_update() {
    let collisions = [];

    for (let i = 0; i < game.entities.length; i++) {
        for (let j = i + 1; j < game.entities.length; j++) {
            if (check_if_collision(game.entities[i], game.entities[j])) {
                collisions.push([game.entities[i], game.entities[j]]);
                console.log('collision detected')
            }
        }
    }

    return collisions;
}

function resolve_collisions(collisions) {   
    // TODO
    for (let i = 0; i < collisions.length; i++) {

        console.log('Resolving collision between ' + collisions[i][0].type + ' and ' + collisions[i][1].type);
        let entity1 = collisions[i][0];
        let entity2 = collisions[i][1];
        let vCollision = {x: entity2.x - entity1.x, y: entity2.y - entity1.y};
        let distance = Math.sqrt((entity2.x-entity1.x)*(entity2.x-entity1.x) + (entity2.y-entity1.y)*(entity2.y-entity1.y));
        let vCollisionNorm = {x: vCollision.x / distance, y: vCollision.y / distance};
        let vRelativeVelocity = {x: entity1.v_x - entity2.v_x, y: entity1.v_y - entity2.v_y};
        let speed = vRelativeVelocity.x * vCollisionNorm.x + vRelativeVelocity.y * vCollisionNorm.y;
        if (speed < 0) {
            break;
        }
        entity1.v_x -= (speed * vCollisionNorm.x);
        entity1.v_y -= (speed * vCollisionNorm.y);
        entity2.v_x += (speed * vCollisionNorm.x);
        entity2.v_y += (speed * vCollisionNorm.y);

    }
}




function render_board() {    
    //console.log('render_board()')
    let canvas = document.getElementById('gameCanvas');
    let context = canvas.getContext('2d');

    context.fillStyle= '#EEEEEE';  
    context.fillRect(0, 0, canvas.width, canvas.height); // Clear the board
    
    // Draw each entity on the canvas
    game.entities.forEach(entity => {
        entity.draw();
    });

}


loadApp();
game_loop_client();