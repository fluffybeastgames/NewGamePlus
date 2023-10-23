'use strict'
const RENDER_REFRESH_TIME = 16; // time in ms to wait after rendering before rendering. Due to how setTimeout works, may be up to 16 ms late
let game;
let pressedKeys = {};
let canvas;
// let botAgent; // the test bot agent that will be used to play the game
// let botAgent2;
// let botAgent3;
// let botAgent4;
// let botAgent5;
// let botAgent6;
// let botAgent7;


let END_ZONE_WIDTH = 100;
let CANVAS_WIDTH = 1800;
let CANVAS_HEIGHT = 900;
let PLAYER_DIAMETER = 50;

const BULLET_SPEED = 10;
let bullet_id_counter = 0;

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
        
            let num_player_bullets = 0;
            for (let key in game.entities) {
                if (game.entities[key].type == 'ore_bullet' && key == 'player') {
                    num_player_bullets += 1;
                }
            }

            if (num_player_bullets < game.entities['player'].bullet_count_max & game.score_team_1 >= 5) {
                bullet_id_counter += 1;
                game.entities['bullet' + bullet_id_counter] = new OreBullet(canvas.getContext('2d'), 'player', game.entities['player'].x, game.entities['player'].y, mousePos['x'], mousePos['y'], 10, 10, '#FF6666');
                game.score_team_1 -= 5;
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
    scoreDivLeft.style.fontSize = '48px';
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
    scoreDivRight.style.fontSize = '48px';
    scoreDivRight.style.fontFamily = 'Arial';
    scoreDivRight.style.textAlign = 'center';
    scoreDivRight.style.color = '#0000DD';
    scoreDivRight.style.verticalAlign = 'middle';
    scoreDivRight.innerHTML = 'Score: 0';
    gameDiv.appendChild(scoreDivRight);

    //Add debug readout
    let debugDiv = document.createElement('div');
    debugDiv.id = 'debugDiv';
    debugDiv.style.position = 'absolute';
    debugDiv.style.top = (canvas.height + 250) + 'px';
    debugDiv.style.left = '50px';
    debugDiv.style.width = canvas.width/2;
    debugDiv.style.height = '50px';
    debugDiv.style.zIndex = '1';
    debugDiv.style.fontSize = '16px';
    debugDiv.style.fontFamily = 'Arial';
    debugDiv.style.textAlign = 'left';
    debugDiv.style.color = '#000000';
    debugDiv.style.verticalAlign = 'middle';
    debugDiv.innerHTML = '';
    gameDiv.appendChild(debugDiv);




    window.onkeyup = function(e) { 
        // e.preventDefault();
        pressedKeys[e.keyCode] = false; 
    }
    window.onkeydown = function(e) { 
        // e.preventDefault();
        pressedKeys[e.keyCode] = true; 
    }
    
    game = new NewGamePlus(canvas);

    // Enemy bots
    // botAgent = new DumbBot(1, true); //pass it the entity_id for the corresponding GamePlayer entity
    // botAgent2 = new DumbBot(7, true); //pass it the entity_id for the corresponding GamePlayer entity
    // botAgent3 = new DumbBot(8, true); //pass it the entity_id for the corresponding GamePlayer entity
    // botAgent4 = new DumbBot(9, true); //pass it the entity_id for the corresponding GamePlayer entity
    // botAgent5 = new DumbBot(10, true); //pass it the entity_id for the corresponding GamePlayer entity

    // Friendly bots
    // botAgent6 = new DumbBot(11, false); //pass it the entity_id for the corresponding GamePlayer entity
    // botAgent7 = new DumbBot(12, false); //pass it the entity_id for the corresponding GamePlayer entity

    
            
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
        let bullet_speed = BULLET_SPEED;

        this.max_v_x = 15;
        this.max_v_y = 15;

        this.bounces_left = 3; // how many times the bullet can bounce off of walls before disappearing
        this.time_left = 20000; // how long the bullet will last before disappearing

        // let bullet_angle = Math.atan2(dest_y - this.y, dest_x - this.x) * 180 / Math.PI;
        // this.v_x = bullet_speed * Math.cos(bullet_angle* Math.PI / 180);
        // this.v_y = bullet_speed * Math.sin(bullet_angle* Math.PI / 180);

        let bullet_angle = Math.atan2(dest_y - this.y, dest_x - this.x);
        this.v_x = BULLET_SPEED * Math.cos(bullet_angle);
        this.v_y = BULLET_SPEED * Math.sin(bullet_angle);
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
    constructor(context, player_name, x, y, color) {
        let diameter = PLAYER_DIAMETER;
        super(context, x, y, diameter, color);
        this.player_name = player_name; 
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

        this.bullet_count_max = 20;
    }

    draw() {
        super.draw();
        this.context.font = '24px serif';
        this.context.fillStyle = 'black';
        this.context.textAlign = 'center';
        this.context.fillText(this.player_name, this.x, this.y - this.radius - 7);
    }
}

class GameObstacle {
    // An immovable object that can be collided with
    constructor(context, type, shape, x, y, color) {
        this.context = context;
        this.type = type;
        this.shape = shape;
        this.x = x;
        this.y = y;
        this.color = color;
    }    
}

class Triangle extends GameObstacle {
    constructor(context, x, y, width, height, color) {
        super(context, 'triangle', 'triangle', x, y, color);


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

        // If the ore is in the middle, it grows
        if (Math.abs(this.x - game.canvas.width/2) < Math.max(this.diameter, 1)) {
        // if (this.x == this.spawn_x && this.y == this.spawn_y) {
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

        this.context.font = '14px serif';
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
            
            game.score_team_2 += ore_to_transfer;

        }
        if (this.x >= CANVAS_WIDTH - END_ZONE_WIDTH) { //TODO magic number
            let ore_to_transfer = Math.min(this.ore, this.ore_score_rate);
            this.ore -= ore_to_transfer;
            
            game.score_team_1 += ore_to_transfer;

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

        this.score_team_1 = 50;
        this.score_team_2 = 50;

        this.num_bots = 1;

        this.entities = {};
        this.entities['player'] = new GamePlayer(context, 'Zeke', END_ZONE_WIDTH, canvas.height/2, '#FF6666');
        // this.entities[] = new Square(context, 0, 0, 20, 20, '#DD0000');
        
        this.entities['ore1'] = new Ore(context, canvas.width/2, 150, '#00BBBB', .1, 75);
        this.entities['ore2'] = new Ore(context, canvas.width/2, 300, '#00BBBB', .1, 50);
        this.entities['ore3'] = new Ore(context, canvas.width/2, canvas.height/2, '#00BBBB', .1, END_ZONE_WIDTH);
        this.entities['ore4'] = new Ore(context, canvas.width/2, canvas.height - 300, '#00BBBB', .1, 50);
        this.entities['ore5'] = new Ore(context, canvas.width/2, canvas.height - 150, '#00BBBB', .1, 75);
        
        for (let i = 1; i <= this.num_bots; i++) {
            let starting_x;
            let starting_y;
            let color;
            let on_the_right;

            if (i % 2 != 0) {
                starting_x = canvas.width - END_ZONE_WIDTH + PLAYER_DIAMETER;
                starting_y = Math.random()*canvas.height;
                color = '#0000DD';
                on_the_right = true;

            } else {
                starting_x = END_ZONE_WIDTH;
                starting_y = Math.random()*canvas.height;
                color = '#DD0000';
                on_the_right = false;
            }
            this.entities['bot' + i] = new DumbBot(context, 'Bot ' + i, starting_x, starting_y, color, on_the_right);
        }
        // this.entities['bot1'] = new DumbBot(context, 1, canvas.width - END_ZONE_WIDTH, canvas.height/2, '#0000DD', true);
        // this.entities['bot2'] = new DumbBot(context, 2, canvas.width - END_ZONE_WIDTH, canvas.height/3, '#0000DD', true);
        // this.entities['bot3'] = new DumbBot(context, 3, canvas.width - END_ZONE_WIDTH, canvas.height*2/3, '#0000DD', true);
        // this.entities['bot4'] = new DumbBot(context, 4, canvas.width - END_ZONE_WIDTH, canvas.height/5, '#0000DD', true);
        // this.entities['bot5'] = new DumbBot(context, 5, canvas.width - END_ZONE_WIDTH, canvas.height*4/5, '#0000DD', true);
        
        // this.entities['bot6'] = new DumbBot(context, 6, END_ZONE_WIDTH, canvas.height*1/3, '#DD0000', false);
        // this.entities['bot7'] = new DumbBot(context, 7, END_ZONE_WIDTH, canvas.height*2/3, '#DD0000', false);
        // this.entities['bot8'] = new DumbBot(context, 8, END_ZONE_WIDTH, canvas.height/5, '#DD0000', false);
        // this.entities['bot9'] = new DumbBot(context, 9, END_ZONE_WIDTH, canvas.height*4/5, '#DD0000', false);
        
        // this.entities[] = new GamePlayer(context, 5, 1750, 600, '#0000DD');

        // this.entities[] = new Circle(context, 0, 200, 15, '#444444');
    }
}

class DumbBot extends GamePlayer {
    constructor(context, id, x, y, color, is_on_right_side) {
        super(context, id, x, y, color);
        // this.team = 
        this.is_on_right_side = is_on_right_side;
        this.current_target = 'player';

        // this.set_smart_target();
        
    }
    make_a_move() {
        let distance_x = game.entities[this.current_target].x - this.x;
        let distance_y = game.entities[this.current_target].y - this.y;
        let distance = Math.sqrt(distance_x**2 + distance_y**2);

        if (Math.abs(distance) < this.radius + game.entities[this.current_target].radius + 5 | Math.random() > .95) {
        // if (Math.abs(distance) < this.radius + game.entities[this.current_target].radius + 5 ) {
            // this.set_target(Math.random()*CANVAS_WIDTH, Math.random()*CANVAS_HEIGHT);
            // this.set_random_target();
            this.set_smart_target();
            distance_x = game.entities[this.current_target].x - this.x;
            distance_y = game.entities[this.current_target].y - this.y;
            distance = Math.sqrt(distance_x**2 + distance_y**2);

        }

        if (distance_x > 0) {
            
            this.acc_x += .25 //* Math.abs((distance_x/distance));
            
            if (this.is_on_right_side) {
                this.acc_y += .1 //* Math.abs((distance_x/distance));
            }

        } else if (distance_x < 0) {
            this.acc_x -= .25 //* Math.abs((distance_x/distance));

            if (!this.is_on_right_side) {
                this.acc_y -= .1 //* Math.abs((distance_x/distance));
            }
        }

        if (distance_y > 0) {
            this.acc_y += .1 //* Math.abs((distance_y/distance));
        } else if (distance_y < 0) {
            this.acc_y -= .1 //* Math.abs((distance_y/distance));
        }
    }

    consider_shooting_at_target() {
        //TODO improve this
        if (Math.random() > .999) {
            // console.log('shoot')
            let distance_x = game.entities[this.current_target].x - this.x;
            let distance_y = game.entities[this.current_target].y - this.y;
            let bullet_angle = Math.atan2(distance_y, distance_x);
            
            // Set the lead distance using the target's velocity (and maybe later their acc)
            // "Bullet flight time to target times speed of target will give you the lead distance.""
            let lead_distance_x = distance_x/(BULLET_SPEED * Math.cos(bullet_angle))*game.entities[this.current_target].v_x;
            let lead_distance_y = distance_y/(BULLET_SPEED * Math.sin(bullet_angle))*game.entities[this.current_target].v_y;
            distance_x += lead_distance_x;
            distance_y += lead_distance_y;

            // distance_x += game.entities[this.current_target].radius; // aim to the right of the target

            // if (game.entities[this.current_target].v_x > 0) {
            //     lead_distance_x = game.entities[this.current_target].v_x * 10;
            

            if((this.is_on_right_side & game.score_team_2 >= 5 & distance_x < -1*game.entities[this.current_target].radius) | (!this.is_on_right_side & game.score_team_1 >= 5 & distance_x > game.entities[this.current_target].radius)){
                bullet_id_counter += 1;
                game.entities[bullet_id_counter] = new OreBullet(game.canvas.getContext('2d'), this.entity_id, this.x, this.y, game.entities[this.current_target].x, game.entities[this.current_target].y, 10, 10, this.color);
                
                if(this.is_on_right_side) {
                    game.score_team_2 -= 5; //TODO magic number
                } else {
                    game.score_team_1 -= 5; //TODO magic number
                };
            }
        }
    }

    set_target(entity_id) {
        this.current_target = entity_id;
        this.current_target_original_distance_x = this.x - game.entities[this.current_target].x;
        this.current_target_original_distance_y = this.y - game.entities[this.current_target].y;
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
        let target_weights = [0, 0, 0, 0, 0];
        let target_option_ids = ['ore1', 'ore2', 'ore3', 'ore4', 'ore5'];
        
        target_weights[0] = 1/Math.sqrt((game.entities['ore1'].x - this.x)**2 + (game.entities['ore1'].y - this.y)**2)*(game.entities['ore1'].ore**3)//; *(this.x - game.entities[2].x);
        target_weights[1] = 1/Math.sqrt((game.entities['ore2'].x - this.x)**2 + (game.entities['ore2'].y - this.y)**2)*(game.entities['ore2'].ore**3)//; *(this.x - game.entities[3].x);
        target_weights[2] = 1/Math.sqrt((game.entities['ore3'].x - this.x)**2 + (game.entities['ore3'].y - this.y)**2)*(game.entities['ore3'].ore**3)//; *(this.x - game.entities[4].x);
        target_weights[3] = 1/Math.sqrt((game.entities['ore4'].x - this.x)**2 + (game.entities['ore4'].y - this.y)**2)*(game.entities['ore4'].ore**3)//; *(this.x - game.entities[5].x);
        target_weights[4] = 1/Math.sqrt((game.entities['ore5'].x - this.x)**2 + (game.entities['ore5'].y - this.y)**2)*(game.entities['ore5'].ore**3)//; *(this.x - game.entities[6].x);
        
        if(this.is_on_right_side) {
            target_weights[0] *= game.entities['ore1'].x**4;
        } else {
            target_weights[0] *= 1/game.entities['ore1'].x**4;
        }
        if(this.is_on_right_side) {
            target_weights[1] *= game.entities['ore2'].x**4;
        } else {
            target_weights[1] *= 1/game.entities['ore2'].x**4;
        }
        if(this.is_on_right_side) {
            target_weights[2] *= game.entities['ore3'].x**4;
        } else {
            target_weights[2] *= 1/game.entities['ore3'].x**4;
        }
        if(this.is_on_right_side) {
            target_weights[3] *= game.entities['ore4'].x**4;
        } else {
            target_weights[3] *= 1/game.entities['ore4'].x**4;
        }
        if(this.is_on_right_side) {
            target_weights[4] *= game.entities['ore5'].x**4;
        } else {
            target_weights[4] *= 1/game.entities['ore5'].x**4;
        }
        
        this.set_target(target_option_ids[target_weights.indexOf(Math.max(...target_weights))]);


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
    game.entities['player'].acc_x = 0;
    game.entities['player'].acc_y = 0;
    
    if (pressedKeys[87] | pressedKeys[38]) { // W | Up
        game.entities['player'].acc_y = -.2;
    }
    if (pressedKeys[65] | pressedKeys[37]) { // A | Left
        game.entities['player'].acc_x = -.2;
    }
    if (pressedKeys[83] | pressedKeys[40]) { // S | Down
        game.entities['player'].acc_y = .2;
    }
    if (pressedKeys[68] | pressedKeys[39]) { // D | Right
        game.entities['player'].acc_x = .2;
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

    for (let i = 1; i <= game.num_bots; i++) {
        // Simulate keyboard input
        game.entities['bot' + i].make_a_move();
        
        // Aim for the current target and maybe shoot at it
        game.entities['bot' + i].consider_shooting_at_target();
    }

    
    
}

function clean_up_objects() {
    for (let key in game.entities) {
        if (game.entities[key].type == 'ore_bullet') {
            if (game.entities[key].bounces_left <= 0 | game.entities[key].time_left <= 0) {
                delete game.entities[key];
            };
        };
    };
}

function ore_score_check() {  
    for (let key in game.entities) {
        if (game.entities[key].type == 'ore' | game.entities[key].type == 'ore_bullet') {
            // check if ore is inside of the goal zones
            // if so, add points to the player's score
            // and shrink the ore
            game.entities[key].score_check();
        };
    }
}

function positional_logic_update() {
    // Update the position of each entity
    // console.log('positional_logic_update() called');
    for (let key in game.entities) {
        game.entities[key].update_position(Date.now() - game.last_update);
    }
}

function position_penalty_logic() {
    // TODO - make this work with arbitrary numbers of players belonging to one of two teams
    // apply penalties for being offsides
    if (game.entities['player'].x > CANVAS_WIDTH/2) {
        game.score_team_1 -= .0025*(Date.now() - game.last_update);
        if(game.score_team_1 < 0) {
            game.score_team_1 = 0;
        }
    }
    if (game.entities['bot1'].x < CANVAS_WIDTH/2) {
        game.score_team_2 -= .0025*(Date.now() - game.last_update);
        if(game.score_team_2 < 0) {
            game.score_team_2 = 0;
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
    
    let array_of_entities = Object.values(game.entities);
  
    for (let i = 0; i < array_of_entities.length; i++) {
        for (let j = i + 1; j < array_of_entities.length; j++) {
            if (check_if_collision(array_of_entities[i], array_of_entities[j])) {
                collisions.push([array_of_entities[i], array_of_entities[j]]);
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
    for (let i = 0; i < canvas.width; i += END_ZONE_WIDTH/3) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, canvas.height);
        context.stroke();
    }
    for (let i = 0; i < canvas.height; i += END_ZONE_WIDTH/3) {
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
    for (let key in game.entities) {
        game.entities[key].draw();
    }

}

function render_score() {
    let scoreDivLeft = document.getElementById('scoreDivLeft');
    let scoreDivRight = document.getElementById('scoreDivRight');
    scoreDivLeft.innerHTML = 'Score: ' + Math.floor(game.score_team_1);
    scoreDivRight.innerHTML = 'Score: ' + Math.floor(game.score_team_2);


}


loadApp();
game_loop_client();