'use strict'
const RENDER_REFRESH_TIME = 16; // time in ms to wait after rendering before rendering. Due to how setTimeout works, may be up to 16 ms late
let game;
let pressedKeys = {};

function loadApp() {
    console.log('loadApp() called');   

    let gameDiv = document.getElementById('game_div');

    let canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.border = '1px solid red';
    canvas.style.position = 'absolute'; 
    canvas.style.zIndex = '-1'; // set to a low z index to make overlapping elements cover the canvas
    
    let context = canvas.getContext('2d');

    gameDiv.appendChild(canvas);

    window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
    window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }
    
    game = new NewGamePlus(context);
}

class GameEntity {
    constructor(context, type, x, y, width, height, color) {
        this.context = context;
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
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


class NewGamePlus {
    constructor(context) {
        this.id = -1;
        ////

        this.entities = [];
        this.entities.push(new GameEntity(context, 'player 1', 0, 0, 20, 20, '#DD0000'));
        this.entities.push(new GameEntity(context, 'bot 1', 0, 50, 50, 50, '#BBFF00'));
        this.entities.push(new GameEntity(context, 'barrier 1', 25, 175, 25, 25, '#0000BB'));
        this.entities.push(new GameEntity(context, 'bot 2', 500, 200, 25, 25, '#0000BB'));
        this.entities.push(new GameEntity(context, 'barrier 2', 200, 300, 250, 10, '#0000BB'));
        
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

        this.entities[3].v_x = 0;
        this.entities[3].v_y = 0;
        this.entities[3].acc_x = -.1;
        this.entities[3].acc_y = 0;
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
    
    if (pressedKeys[87]) { // W
        game.entities[0].acc_y = -.05;
    }
    if (pressedKeys[65]) { // A
        game.entities[0].acc_x = -.05;
    }
    if (pressedKeys[83]) { // S
        game.entities[0].acc_y = .05;
    }
    if (pressedKeys[68]) { // D
        game.entities[0].acc_x = .05;
    }



}


function positional_logic_update() {
    // Update the position of each entity
    console.log('positional_logic_update() called');
    
    game.entities.forEach(entity => {
        entity.x += entity.v_x;
        entity.y += entity.v_y;
            
        entity.v_x += entity.acc_x;
        entity.v_y += entity.acc_y;
        
        entity.v_x *= .99; // drag
        entity.v_y *= .99; // drag
        

        if(entity.v_x > entity.max_v_x) {
            entity.v_x = entity.max_v_x;
        } else if(entity.v_x < -entity.max_v_x) {
            entity.v_x = -entity.max_v_x;
        }

        if(entity.v_y > entity.max_v_y) {
            entity.v_y = entity.max_v_y;
        } else if (entity.v_y < -entity.max_v_y) {
            entity.v_y = -entity.max_v_y;
        }

        
        // Wall bounce check
        bouncy_wall_check(entity);

    });

}

function check_if_collision(entity1, entity2) {
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


function bouncy_wall_check(entity) {
    if (entity.x < 0) {
        entity.x = 0;
        entity.v_x *= -.5;
        entity.acc_x *= -.2;
    }
    if (entity.x + entity.width > 800) {
        entity.x = 800 - entity.width;
        entity.v_x *= -.5;
        entity.acc_x *= -.2;
    }
    if (entity.y < 0) {
        entity.y = 0;
        entity.v_y *= -.5;
        entity.acc_y *= -.2;
    }
    if (entity.y + entity.height > 600) {
        entity.y = 600 - entity.height;
        entity.v_y *= -.5;
        entity.acc_y *= -.2;
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
        context.fillStyle = entity.color;
        context.fillRect(entity.x, entity.y, entity.width, entity.height);
    });

}


loadApp();
game_loop_client();