'use strict'
const RENDER_REFRESH_TIME = 16; // time in ms to wait after rendering before rendering. Due to how setTimeout works, may be up to 16 ms late
let game;
let pressedKeys = {};
let canvas;

function loadApp() {
    console.log('loadApp() called');   

    let gameDiv = document.getElementById('game_div');

    canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    canvas.width = 1800;
    canvas.height = 900;
    canvas.style.border = '2px solid black';
    canvas.style.position = 'absolute'; 
    canvas.style.zIndex = '-1'; // set to a low z index to make overlapping elements cover the canvas
    canvas.style.left = '50px';
    canvas.style.top = '150px';
    

    addEventListener('mousedown',function(e) { 
        e.preventDefault();
        // console.log('mouse down');
        // console.log(e);
        
        if (e.button == 0) { //left click
            let mousePos = get_mouse_position(canvas, e);
            console.log(mousePos)
            // game.entities.push(new OreBullet(canvas.getContext('2d'), mousePos['x'], mousePos['y'], 10, 10, '#008888'));
            game.entities.push(new OreBullet(canvas.getContext('2d'), game.entities[0].x, game.entities[0].y, mousePos['x'], mousePos['y'], 10, 10, '#008888'));
        };

        function get_mouse_position(canvas, event) {
            let rect = canvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
                
            };
        }
    });

    gameDiv.appendChild(canvas);
    
    //Add score readout
    //Add score for each player
    //Left player
    let scoreDivLeft = document.createElement('div');
    scoreDivLeft.id = 'scoreDivLeft';
    scoreDivLeft.style.position = 'absolute';
    scoreDivLeft.style.top = '0px';
    scoreDivLeft.style.left = '0px';
    scoreDivLeft.style.width = canvas.width/2;
    scoreDivLeft.style.height = '100%';
    scoreDivLeft.style.zIndex = '1';
    scoreDivLeft.style.fontSize = '24px';
    scoreDivLeft.style.fontFamily = 'Arial';
    scoreDivLeft.style.textAlign = 'center';
    scoreDivLeft.style.verticalAlign = 'middle';
    scoreDivLeft.innerHTML = 'Score: 0';
    gameDiv.appendChild(scoreDivLeft);

    //Right player
    let scoreDivRight = document.createElement('div');
    scoreDivRight.id = 'scoreDivRight';
    scoreDivRight.style.position = 'absolute';
    scoreDivRight.style.top = '0px';
    scoreDivRight.style.right = '0px';
    scoreDivRight.style.width = canvas.width/2;
    scoreDivRight.style.height = '100%';
    scoreDivRight.style.zIndex = '1';
    scoreDivRight.style.fontSize = '24px';
    scoreDivRight.style.fontFamily = 'Arial';
    scoreDivRight.style.textAlign = 'center';
    scoreDivRight.style.verticalAlign = 'middle';
    scoreDivRight.innerHTML = 'Score: 0';
    gameDiv.appendChild(scoreDivRight);

    //Add debug readout

    window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
    window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }
    
    game = new NewGamePlus(canvas);
}

class GameEntity {
    constructor(context, type, shape, x, y, color) {
        this.context = context;
        this.type = type;
        this.shape = shape;
        this.x = x;
        this.y = y;
        this.color = color;

        this.v_x = 0; // velocity
        this.v_y = 0;
        
        this.acc_x = 0; // acceleration
        this.acc_y = 0;
        
        this.max_v_x = 5;
        this.max_v_y = 5;
        
        this.max_acc_x = 1;
        this.max_acc_y = 1;

        // max_v_x, max_v_y, max_acc_x, max_acc_y
    }
}


class Square extends GameEntity {
    constructor(context, x, y, width, height, color) {
        super(context, 'square', 'square', x, y, color);
        
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

class OreBullet extends Square {
    constructor(context, x, y, dest_x, dest_y, width, height, color) {
        super(context, x, y, width, height, color);
        
        let bullet_speed = 5;

        // let bullet_angle = Math.atan2(dest_y - this.y, dest_x - this.x) * 180 / Math.PI;
        // this.v_x = bullet_speed * Math.cos(bullet_angle* Math.PI / 180);
        // this.v_y = bullet_speed * Math.sin(bullet_angle* Math.PI / 180);

        let bullet_angle = Math.atan2(dest_y - this.y, dest_x - this.x);
        this.v_x = bullet_speed * Math.cos(bullet_angle);
        this.v_y = bullet_speed * Math.sin(bullet_angle);
    }

    update_position(timePassed) {
        // this.x += this.vx * timePassed;
        // this.y += this.vy * timePassed;

        this.x += this.v_x;
        this.y += this.v_y;

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

    bouncy_wall_check() {
        if (this.x < 0) {
            this.x = 0;
            this.v_x *= -1;
            this.acc_x *= -1;
        }
        if (this.x + this.width > game.canvas.width) {
            this.x = game.canvas.width - this.width;
            this.v_x *= -1;
            this.acc_x *= -1;
        }
        if (this.y < 0) {
            this.y = 0;
            this.v_y *= -1;
            this.acc_y *= -1;
        }
        if (this.y + this.height > game.canvas.height) {
            this.y = game.canvas.height - this.height;
            this.v_y *= -1;
            this.acc_y *= -1;
        }

    }
}


class Circle extends GameEntity {
    constructor(context, x, y, diameter, color) {
        super(context, 'circle', 'circle', x, y, color);
        
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

class GamePlayer extends Circle {
    constructor(context, x, y, color) {
        let diameter = 33;
        super(context, x, y, diameter, color);
        
        this.score = 0;
        this.score_multiplier = 1;
        this.score_multiplier_max = 5;
        this.score_multiplier_growth_rate = .05;
        this.score_multiplier_decay_rate = .01;
        this.score_multiplier_decay_delay = 1000; // ms
        this.score_multiplier_decay_delay_counter = 0;
    }

}


class Ore extends GameEntity {
    constructor(context, x, y, color, ore_points_initial) {
        super(context, 'ore', 'circle', x, y, color);
        
        this.spawn_x = x; // where the ore spawns/ respawns
        this.spawn_y = y;

        this.ore_growth_rate = .05; // ore points per second
        this.ore = ore_points_initial;
        this.ore_points_max = 50;
       
        this.point_size_ratio = 1.5; // how many pixels per ore point
        this.diameter = this.ore * this.point_size_ratio;        
        this.radius = this.diameter/2;
        
    }

    update_position(timePassed) {
        // this.x += this.vx * timePassed;
        // this.y += this.vy * timePassed;

        if (this.x == this.spawn_x && this.y == this.spawn_y) {
            this.ore += this.ore_growth_rate * timePassed;

            if (this.ore > this.ore_points_max) {
                this.ore = this.ore_points_max;
            };    
        }
        
        this.diameter = this.ore * this.point_size_ratio; 
        this.radius = this.diameter/2;

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

        this.context.font = '14px';
        this.context.fillStyle = 'black';
        this.context.textAlign = 'center';
        this.context.fillText(Math.round(this.ore), this.x, this.y);

    }

    bouncy_wall_check() {
        if (this.x < this.radius) {
            this.x = this.radius;
            this.v_x *= 0;
            this.acc_x *= -.2;
        }
        if (this.x + this.radius > game.canvas.width) {
            this.x = game.canvas.width - this.radius;
            this.v_x *= 0;
            this.acc_x *= -.2;
        }
        if (this.y < this.radius) {
            this.y = this.radius;
            this.v_y *= .5;
            this.acc_y *= -.2;
        }
        if (this.y + this.radius > game.canvas.height) {
            this.y = game.canvas.height - this.radius;
            this.v_y *= .5;
            this.acc_y *= -.2;
        }
    }

    score_check() {
        // check if ore is inside of the goal zones
        // if so, add points to the player's score
        // and shrink the ore
        if (this.x <= 50) {
            let ore_to_transfer = Math.min(this.ore, .3);
            this.ore -= ore_to_transfer;
            
            game.entities[0].score += ore_to_transfer;

        }
        if (this.x >= 1750) { //TODO magic number
            let ore_to_transfer = Math.min(this.ore, .3);
            this.ore -= ore_to_transfer;
            
            game.entities[1].score += ore_to_transfer;

        }
        
        this.diameter = this.ore * this.point_size_ratio; 
        this.radius = this.diameter/2;

        if(this.ore <= 0) {
            this.x = this.spawn_x;
            this.y = this.spawn_y;
        
            this.v_x = 0;
            this.v_y = 0;

            this.acc_x = 0;
            this.acc_y = 0;
        }
    }
    
}



class NewGamePlus {
    constructor(canvas) {        
        this.id = -1;
        this.canvas = canvas;
        let context = canvas.getContext('2d');

        this.entities = [];
        this.entities.push(new GamePlayer(context, 50, 450, '#DD0000'));
        this.entities.push(new GamePlayer(context, 1750, 450, '#0000DD'));
        // this.entities.push(new Square(context, 0, 0, 20, 20, '#DD0000'));
        this.entities.push(new Ore(context, 900, 150, '#00BBBB', .1));
        this.entities.push(new Ore(context, 900, 300, '#00BBBB', .1));
        this.entities.push(new Ore(context, 900, 450, '#00BBBB', .1));
        this.entities.push(new Ore(context, 900, 600, '#00BBBB', .1));
        this.entities.push(new Ore(context, 900, 750, '#00BBBB', .1));
        // this.entities.push(new Circle(context, 0, 200, 15, '#444444'));
  
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
        
        ore_score_check(); // apply scores to players for ore inside of the goal zones and shrink the ore
        
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
        render_score(); // Redraw the score
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

function ore_score_check() {  
    game.entities.forEach(entity => {
        if (entity.type == 'ore' | entity.type == 'ore_bullet') {
            // check if ore is inside of the goal zones
            // if so, add points to the player's score
            // and shrink the ore
            entity.score_check();
           

        };
    });

}
function positional_logic_update() {
    // Update the position of each entity
    console.log('positional_logic_update() called');
    
    game.entities.forEach(entity => {
        entity.update_position(1)
    });

}

function check_if_collision(entity1, entity2) {
    if (entity1.shape == 'square' && entity2.shape == 'square') {
        return square_collision_check(entity1, entity2);
    } else if (entity1.shape == 'circle' && entity2.shape == 'circle') {  
        return circle_collision_check(entity1, entity2);
    } else if (entity1.shape == 'circle' && entity2.shape == 'square') {
        return circle_rectangle_collision_check(entity1, entity2);
    } else if (entity1.shape == 'square' && entity2.shape == 'circle') {
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
    // TODO - make this work with both circles and squares
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
    
    // Draw the grid
    context.strokeStyle = '#CCCCCC';
    context.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, canvas.height);
        context.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(canvas.width, i);
        context.stroke();
    }

    //Draw goal lines
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(50, 0);
    context.lineTo(50, canvas.height);
    context.stroke();
    context.beginPath();
    context.moveTo(canvas.width-50, 0);
    context.lineTo(canvas.width-50, canvas.height);
    context.stroke();
    context.beginPath();
    context.moveTo(canvas.width/2, 0);
    context.lineTo(canvas.width/2, canvas.height);
    context.stroke();
    

    // Draw each entity on the canvas
    game.entities.forEach(entity => {
        entity.draw();
    });

}

function render_score() {
    let scoreDivLeft = document.getElementById('scoreDivLeft');
    let scoreDivRight = document.getElementById('scoreDivRight');
    scoreDivLeft.innerHTML = 'Score: ' + Math.round(game.entities[0].score);
    scoreDivRight.innerHTML = 'Score: ' + Math.round(game.entities[1].score);


}


loadApp();
game_loop_client();