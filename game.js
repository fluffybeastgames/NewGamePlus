'use strict'
const RENDER_REFRESH_TIME = 16; // time in ms to wait after rendering before rendering. Due to how setTimeout works, may be up to 16 ms late
let game;
let pressedKeys = {};
let canvas;
let botAgent; // the test bot agent that will be used to play the game

let END_ZONE_WIDTH = 100;
let CANVAS_WIDTH = 1800;
let CANVAS_HEIGHT = 900;

function loadApp() {
    console.log('loadApp() called');   

    let gameDiv = document.getElementById('game_div');

    canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.border = '2px solid black';
    canvas.style.position = 'absolute'; 
    canvas.style.zIndex = '-1'; // set to a low z index to make overlapping elements cover the canvas
    canvas.style.left = '50px';
    canvas.style.top = '100px';
    

    addEventListener('mousedown',function(e) { 
        e.preventDefault();
        // console.log('mouse down');
        // console.log(e);
        
        if (e.button == 0) { //left click
            let mousePos = get_mouse_position(canvas, e);
            let owner_id = 0; //player is always the first entity in the game.entities array.. for now.

            let num_player_bullets = 0;
            game.entities.forEach(entity => {
                if (entity.type == 'ore_bullet' && entity.owner_id == owner_id) {
                    num_player_bullets += 1;
                }
            });

            if (num_player_bullets < game.entities[owner_id].bullet_count_max & game.entities[owner_id].score >= 5) {
                game.entities.push(new OreBullet(canvas.getContext('2d'), owner_id, game.entities[0].x, game.entities[0].y, mousePos['x'], mousePos['y'], 10, 10, '#BB0000'));
                game.entities[owner_id].score -= 5;
            };
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
    scoreDivLeft.style.top = '50px';
    scoreDivLeft.style.left = '0px';
    scoreDivLeft.style.width = canvas.width/2;
    scoreDivLeft.style.height = '150px';
    scoreDivLeft.style.zIndex = '1';
    scoreDivLeft.style.fontSize = '32px';
    scoreDivLeft.style.fontFamily = 'Arial';
    scoreDivLeft.style.textAlign = 'center';
    scoreDivLeft.style.color = '#DD0000';
    scoreDivLeft.style.verticalAlign = 'middle';
    scoreDivLeft.innerHTML = 'Score: 0';
    gameDiv.appendChild(scoreDivLeft);

    //Right player
    let scoreDivRight = document.createElement('div');
    scoreDivRight.id = 'scoreDivRight';
    scoreDivRight.style.position = 'absolute';
    scoreDivRight.style.top = '50px';
    scoreDivRight.style.left = canvas.width/2 + 'px';
    scoreDivRight.style.width = canvas.width/2;
    scoreDivRight.style.height = '150px';
    scoreDivRight.style.zIndex = '1';
    scoreDivRight.style.fontSize = '32px';
    scoreDivRight.style.fontFamily = 'Arial';
    scoreDivRight.style.textAlign = 'center';
    scoreDivRight.style.color = '#0000DD';
    scoreDivRight.style.verticalAlign = 'middle';
    scoreDivRight.innerHTML = 'Score: 0';
    gameDiv.appendChild(scoreDivRight);

    //Add debug readout

    window.onkeyup = function(e) { 
        // e.preventDefault();
        pressedKeys[e.keyCode] = false; 
    }
    window.onkeydown = function(e) { 
        // e.preventDefault();
        pressedKeys[e.keyCode] = true; 
    }
    
    game = new NewGamePlus(canvas);

    botAgent = new BotAgent();
            
    // draw the initial board
    render_board();

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
    constructor(context, owner_id, x, y, dest_x, dest_y, width, height, color) {
        super(context, x, y, width, height, color);
        this.owner_id = owner_id; // which player owns this bullet
        this.type = 'ore_bullet';
        let bullet_speed = 10;

        this.max_v_x = 15;
        this.max_v_y = 15;

        this.bounces_left = 3; // how many times the bullet can bounce off of walls before disappearing
        this.time_left = 20000; // how long the bullet will last before disappearing

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
        
        this.time_left -= timePassed;

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
            this.bounces_left -= 1;
        }
        if (this.x + this.width > game.canvas.width) {
            this.x = game.canvas.width - this.width;
            this.v_x *= -1;
            this.acc_x *= -1;
            this.bounces_left -= 1;
        }
        if (this.y < 0) {
            this.y = 0;
            this.v_y *= -1;
            this.acc_y *= -1;
            this.bounces_left -= 1;
        }
        if (this.y + this.height > game.canvas.height) {
            this.y = game.canvas.height - this.height;
            this.v_y *= -1;
            this.acc_y *= -1;
            this.bounces_left -= 1;
        }

    }

    score_check() {
        //TODO
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

        if(this.acc_x > this.max_acc_x) {   
            this.acc_x = this.max_acc_x;
        } else if(this.acc_x < -this.max_acc_x) {
            this.acc_x = -this.max_acc_x;
        }

        if(this.acc_y > this.max_acc_y) {
            this.acc_y = this.max_acc_y;
        } else if (this.acc_y < -this.max_acc_y) {
            this.acc_y = -this.max_acc_y;
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
    constructor(context, id, x, y, color) {
        let diameter = 33;
        super(context, x, y, diameter, color);
        this.player_id = id; // a unique integer id for each player
        this.max_acc_x = 1;
        this.max_acc_y = 1;
        this.max_v_x = 5;
        this.max_v_y = 5;

        this.score = 50;
        // this.score_multiplier = 1;
        // this.score_multiplier_max = 5;
        // this.score_multiplier_growth_rate = .05;
        // this.score_multiplier_decay_rate = .01;
        // this.score_multiplier_decay_delay = 1000; // ms
        // this.score_multiplier_decay_delay_counter = 0;

        this.bullet_count_max = 10;
    }

}


class Ore extends GameEntity {
    constructor(context, x, y, color, ore_points_initial, ore_points_max) {
        super(context, 'ore', 'circle', x, y, color);
        
        this.spawn_x = x; // where the ore spawns/ respawns
        this.spawn_y = y;

        this.ore_growth_rate = .01; // ore points per second
        this.ore_score_rate = .1; // ore points per second when in the end zone
        this.ore = ore_points_initial;
        this.ore_points_max = ore_points_max;
       
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
            this.v_x *= -.05;
            this.acc_x *= -.2;
        }
        if (this.x + this.radius > game.canvas.width) {
            this.x = game.canvas.width - this.radius;
            this.v_x *= -.05;
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

    score_check() {
        // check if ore is inside of the goal zones
        // if so, add points to the player's score
        // and shrink the ore
        if (this.x <= END_ZONE_WIDTH) {
            let ore_to_transfer = Math.min(this.ore, this.ore_score_rate);
            this.ore -= ore_to_transfer;
            
            game.entities[1].score += ore_to_transfer;

        }
        if (this.x >= CANVAS_WIDTH - END_ZONE_WIDTH) { //TODO magic number
            let ore_to_transfer = Math.min(this.ore, this.ore_score_rate);
            this.ore -= ore_to_transfer;
            
            game.entities[0].score += ore_to_transfer;

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

        this.last_update = Date.now();
        
        this.entities = [];
        this.entities.push(new GamePlayer(context, 0, END_ZONE_WIDTH, canvas.height/2, '#DD0000'));
        this.entities.push(new GamePlayer(context, 1, canvas.width - END_ZONE_WIDTH, canvas.height/2, '#0000DD'));
        // this.entities.push(new Square(context, 0, 0, 20, 20, '#DD0000'));
        this.entities.push(new Ore(context, canvas.width/2, 150, '#00BBBB', .1, 50));
        this.entities.push(new Ore(context, canvas.width/2, 300, '#00BBBB', .1, 25));
        this.entities.push(new Ore(context, canvas.width/2, canvas.height/2, '#00BBBB', .1, END_ZONE_WIDTH));
        this.entities.push(new Ore(context, canvas.width/2, canvas.height - 300, '#00BBBB', .1, 25));
        this.entities.push(new Ore(context, canvas.width/2, canvas.height - 150, '#00BBBB', .1, 50));
        
        // this.entities.push(new GamePlayer(context, 2, canvas.width - END_ZONE_WIDTH, canvas.height/3, '#0000DD'));
        // this.entities.push(new GamePlayer(context, 3, canvas.width - END_ZONE_WIDTH, canvas.height*2/3, '#0000DD'));
        
        // this.entities.push(new GamePlayer(context, 5, 1750, 600, '#0000DD'));

        // this.entities.push(new Circle(context, 0, 200, 15, '#444444'));
    }
}

class BotAgent {
    constructor() {
        this.id = -1;
        this.score = 0;
        this.set_smart_target();
        
    }

    // set_target(x, y) {
    //     this.current_target_x = x;
    //     this.current_target_y = y;

    //     this.current_target_original_distance_x = game.entities[1].x - this.current_target_x;
    //     this.current_target_original_distance_y = game.entities[1].y - this.current_target_y;
    //     console.log('Target set to ' + this.current_target_x + ', ' + this.current_target_y);
    // }

    set_target(entity_id) {
        this.current_target = entity_id;
        this.current_target_original_distance_x = game.entities[1].x - game.entities[this.current_target].x;
        this.current_target_original_distance_y = game.entities[1].y - game.entities[this.current_target].y;
        // console.log('Target set to ' + game.entities[this.current_target].x + ', ' + game.entities[this.current_target].y);
    }

    set_random_target() {
        //pick a target that is within the bounds of the canvas
        let target = Math.floor(Math.random()*5)+2;
        // this.set_target(game.entities[target].x, game.entities[target].y);
        this.set_target(target);
        
    }

    set_smart_target() {
        // consider the distance to each ore, the relative size of the ore, and whether or not the ore is to the left or right of the player
        // TODO
        let target_option_ids = [2, 3, 4, 5, 6];
        let target_weights = [0, 0, 0, 0, 0];
        target_weights[0] = 1/Math.sqrt((game.entities[2].x - game.entities[1].x)**2 + (game.entities[2].y - game.entities[1].y)**2)*(game.entities[2].ore**3)//; *(game.entities[1].x - game.entities[2].x);
        target_weights[1] = 1/Math.sqrt((game.entities[3].x - game.entities[1].x)**2 + (game.entities[3].y - game.entities[1].y)**2)*(game.entities[3].ore**3)//; *(game.entities[1].x - game.entities[3].x);
        target_weights[2] = 1/Math.sqrt((game.entities[4].x - game.entities[1].x)**2 + (game.entities[4].y - game.entities[1].y)**2)*(game.entities[4].ore**3)//; *(game.entities[1].x - game.entities[4].x);
        target_weights[3] = 1/Math.sqrt((game.entities[5].x - game.entities[1].x)**2 + (game.entities[5].y - game.entities[1].y)**2)*(game.entities[5].ore**3)//; *(game.entities[1].x - game.entities[5].x);
        target_weights[4] = 1/Math.sqrt((game.entities[6].x - game.entities[1].x)**2 + (game.entities[6].y - game.entities[1].y)**2)*(game.entities[6].ore**3)//; *(game.entities[1].x - game.entities[6].x);
        
        // if(game.entities[2].x > game.entities[1].x) {
        //     target_weights[0] /= (game.entities[2].x - game.entities[1].x);
        // }
        // if(game.entities[3].x > game.entities[1].x) {
        //     target_weights[1] /= (game.entities[2].x - game.entities[1].x);
        // }
        // if(game.entities[4].x > game.entities[1].x) {
        //     target_weights[2] /= (game.entities[2].x - game.entities[1].x);
        // }
        // if(game.entities[5].x > game.entities[1].x) {
        //     target_weights[3] /= (game.entities[2].x - game.entities[1].x);
        // }
        // if(game.entities[6].x > game.entities[1].x) {
        //     target_weights[4] /= (game.entities[2].x - game.entities[1].x);
        // }

        // if(game.entities[2].x < canvas.width/2) {
            target_weights[0] *= game.entities[2].x**4;
        // }
        // if(game.entities[3].x < canvas.width/2) {
            target_weights[1] *= game.entities[3].x**4;
        // }
        // if(game.entities[4].x < canvas.width/2) {
            target_weights[2] *= game.entities[4].x**4;
        // }
        // if(game.entities[5].x < canvas.width/2) {
            target_weights[3] *= game.entities[5].x**4;
        // }
        // if(game.entities[6].x < canvas.width/2) {
            target_weights[4] *= game.entities[6].x**4;
        // }
        
        

        // console.log(target_weights);
        
        // distance_x = game.entities[botAgent.current_target].x - game.entities[1].x;
        // distance_y = game.entities[botAgent.current_target].y - game.entities[1].y;
        // distance = Math.sqrt(distance_x**2 + distance_y**2);
        this.set_target(target_option_ids[target_weights.indexOf(Math.max(...target_weights))]);

        // distance_x = game.entities[botAgent.current_target].x - game.entities[1].x;


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
        process_bot_input();

        // game logic 
        clean_up_objects(); // remove objects that are no longer needed
        ore_score_check(); // apply scores to players for ore inside of the goal zones and shrink the ore
        
        // positional logic
        positional_logic_update();
        position_penalty_logic(); // apply penalties for being offsides

        // collision detection
        let collisions = collision_detection_update();

        // collision resolution
        if (collisions.length > 0) {
            resolve_collisions(collisions);
        }

        // render
        render_board(); // Redraw the game canvas        
        render_score(); // Redraw the score

        game.last_update = Date.now();
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
        game.entities[0].acc_y = -.075;
    }
    if (pressedKeys[65] | pressedKeys[37]) { // A | Left
        game.entities[0].acc_x = -.075;
    }
    if (pressedKeys[83] | pressedKeys[40]) { // S | Down
        game.entities[0].acc_y = .075;
    }
    if (pressedKeys[68] | pressedKeys[39]) { // D | Right
        game.entities[0].acc_x = .075;
    }

}

function process_bot_input() {
    //possible rewards:
    // 1. score goes up                     5
    // 2. score goes down (negative)        1
    // 2. ore touched                       .25
    // 3. distance to ore goes down         .1
    // 4. offsides penalty (negative)       1 (stacks w/ score down)
    // 5. ore bullet fired (negative)       .1
    // 6. ore bullet hits ore (positive)     3

    
    // capture the board state as a tensor
    let tensor_img = tf.browser.fromPixels(canvas)
    // tensor_img.print();
    tensor_img.dispose();
    // console.log(tf.getBackend());

    // Simulate keyboard input
    //Aim for the current target
    let distance_x = game.entities[botAgent.current_target].x - game.entities[1].x;
    let distance_y = game.entities[botAgent.current_target].y - game.entities[1].y;
    let distance = Math.sqrt(distance_x**2 + distance_y**2);

    if (Math.abs(distance) < game.entities[1].radius + game.entities[botAgent.current_target].radius + 5 | Math.random() > .95) {
    // if (Math.abs(distance) < game.entities[1].radius + game.entities[botAgent.current_target].radius + 5 ) {
        // botAgent.set_target(Math.random()*CANVAS_WIDTH, Math.random()*CANVAS_HEIGHT);
        // botAgent.set_random_target();
        botAgent.set_smart_target();
        distance_x = game.entities[botAgent.current_target].x - game.entities[1].x;
        distance_y = game.entities[botAgent.current_target].y - game.entities[1].y;
        distance = Math.sqrt(distance_x**2 + distance_y**2);

    }

    if (distance_x > 0) {
        
        game.entities[1].acc_x += .25 //* Math.abs((distance_x/distance));
        game.entities[1].acc_y += .1 //* Math.abs((distance_x/distance));

    } else if (distance_x < 0) {
        game.entities[1].acc_x -= .25 //* Math.abs((distance_x/distance));

    }

    if (distance_y > 0) {
        game.entities[1].acc_y += .1 //* Math.abs((distance_y/distance));
    } else if (distance_y < 0) {
        game.entities[1].acc_y -= .1 //* Math.abs((distance_y/distance));
    }

}

function clean_up_objects() {
    game.entities.forEach(entity => {
        if (entity.type == 'ore_bullet') {
            if (entity.bounces_left <= 0 | entity.time_left <= 0) {
                let index = game.entities.indexOf(entity);
                game.entities.splice(index, 1);
            }
        }
    });
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
    // console.log('positional_logic_update() called');
    
    game.entities.forEach(entity => {
        
        entity.update_position(Date.now() - game.last_update)
    });

}

function position_penalty_logic() {
    // TODO
    // apply penalties for being offsides
    if (game.entities[0].x > CANVAS_WIDTH/2) {
        game.entities[0].score -= .0025*(Date.now() - game.last_update);
        if(game.entities[0].score < 0) {
            game.entities[0].score = 0;
        }
    }
    if (game.entities[1].x < CANVAS_WIDTH/2) {
        game.entities[1].score -= .0025*(Date.now() - game.last_update);
        if(game.entities[1].score < 0) {
            game.entities[1].score = 0;
        }
    }

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
                // console.log('collision detected')
            }
        }
    }

    return collisions;
}

function resolve_collisions(collisions) {   
    // TODO - make this work with both circles and squares
    for (let i = 0; i < collisions.length; i++) {

        // console.log('Resolving collision between ' + collisions[i][0].type + ' and ' + collisions[i][1].type);
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

    context.fillStyle= '#FFCCCC';  
    context.fillRect(0, 0, canvas.width/2, canvas.height); // Clear the board
    context.stroke();

    context.fillStyle='#CCCCFF';
    context.fillRect(canvas.width/2, 0, canvas.width, canvas.height); // Clear the board
    context.stroke();

    


    // Draw the grid
    context.strokeStyle = '#888888';
    context.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += END_ZONE_WIDTH) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, canvas.height);
        context.stroke();
    }
    for (let i = 0; i < canvas.height; i += END_ZONE_WIDTH) {
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(canvas.width, i);
        context.stroke();
    }

    // Color the end zones
    context.fillStyle = '#6666FF';
    context.fillRect(0, 0, END_ZONE_WIDTH, canvas.height);
    context.fillStyle = '#FF6666';
    context.fillRect(canvas.width-END_ZONE_WIDTH, 0, END_ZONE_WIDTH, canvas.height);

    //Draw goal lines
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(END_ZONE_WIDTH, 0);
    context.lineTo(END_ZONE_WIDTH, canvas.height);
    context.stroke();
    context.beginPath();
    context.moveTo(canvas.width-END_ZONE_WIDTH, 0);
    context.lineTo(canvas.width-END_ZONE_WIDTH, canvas.height);
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
    scoreDivLeft.innerHTML = 'Score: ' + Math.floor(game.entities[0].score);
    scoreDivRight.innerHTML = 'Score: ' + Math.floor(game.entities[1].score);


}


loadApp();
game_loop_client();