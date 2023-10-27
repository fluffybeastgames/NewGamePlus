'use strict'
const RENDER_REFRESH_TIME = 16; // time in ms to wait after rendering before rendering. Due to how setTimeout works, may be up to 16 ms late
let game;
let pressedKeys = {};
let canvas;

const MAP_WIDTH = 1800;
const MAP_HEIGHT = 900;

const END_ZONE_WIDTH = 200;
const CANVAS_WIDTH = 1800;
const CANVAS_HEIGHT = 900;
const PLAYER_DIAMETER = 50;
const BG_GRID_SIZE = 33;

const BULLET_SPEED = 10; // bullets are launched at fixed speed and do not experience drag
let bullet_id_counter = 0; // used to give each bullet a unique id, so that they can be deleted later

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
                game.score_team_1 -= game.bullet_cost;
            };
        };

        function get_mouse_position(canvas, event) {
            let rect = canvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.left - game.offset_x,
                y: event.clientY - rect.top - game.offset_y                
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
    debugDiv.style.top = 10 + 'px';
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

    gameDiv.appendChild(get_instructions_div()) // requires game to be instantiated first
    
    // draw the initial board
    render_board();

}

function get_instructions_div() {
    let div = document.createElement('div');
    div.id = 'instructions';
    div.style.position = 'absolute';
    div.style.top = (canvas.height + 100) + 'px';
    div.style.left = '50px';
    div.style.width = canvas.width;
    div.style.height = '150px';
    div.style.zIndex = '1';
    div.style.fontSize = '16px';
    div.style.fontFamily = 'Arial';
    div.style.textAlign = 'left';
    div.style.color = '#000000';
    
    let h2 = document.createElement('h2');
    h2.innerHTML = 'How To Play';
    div.appendChild(h2);

    let p1 = document.createElement('p');
    p1.innerHTML = 'Use the arrow or WASD keys to move the player around the screen. Score points by pushing the green ore into the end zone matching your color.';
    div.appendChild(p1);

    let p2 = document.createElement('p');
    p2.innerHTML = 'Shoot ore bullets with the mouse, but beware they cost ' + game.bullet_cost + ' points each. You also lose points for lingering on the enemy\'s side.';
    div.appendChild(p2);

    let p3 = document.createElement('p');
    p3.innerHTML = 'First to ' + game.points_to_win + ' points wins!';
    div.appendChild(p3);

    return div;
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

    draw(offset_x, offset_y) {
        this.context.fillStyle = this.color;
        this.context.fillRect(this.x + offset_x, this.y + offset_y, this.width, this.height);
        
    }

    bouncy_wall_check() {
        if (this.x < 0) {
            this.x = 0;
            this.v_x *= -.5;
            this.acc_x *= -.2;
        }
        if (this.x + this.width > MAP_WIDTH) {
            this.x = MAP_WIDTH - this.width;
            this.v_x *= -.5;
            this.acc_x *= -.2;
        }
        if (this.y < 0) {
            this.y = 0;
            this.v_y *= -.5;
            this.acc_y *= -.2;
        }
        if (this.y + this.height > MAP_HEIGHT) {
            this.y = MAP_HEIGHT - this.height;
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
        if (this.x + this.width > MAP_WIDTH) {
            this.x = MAP_WIDTH - this.width;
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
        if (this.y + this.height > MAP_HEIGHT) {
            this.y = MAP_HEIGHT - this.height;
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

    draw(offset_x, offset_y) {
        let pos_x = this.x + offset_x;
        let pos_y = this.y + offset_y;

        this.context.beginPath();
        this.context.arc(pos_x, pos_y, this.diameter/2, 0, 2 * Math.PI, false);
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
        if (this.x + this.radius > MAP_WIDTH) {
            this.x = MAP_WIDTH - this.radius;
            this.v_x *= -.5;
            this.acc_x *= -.2;
        }
        if (this.y < this.radius) {
            this.y = this.radius;
            this.v_y *= -.5;
            this.acc_y *= -.2;
        }
        if (this.y + this.radius > MAP_HEIGHT) {
            this.y = MAP_HEIGHT - this.radius;
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
        this.max_acc_x = 1.5;
        this.max_acc_y = 1.5;
        this.max_v_x = 5;
        this.max_v_y = 5;

        // this.score = 50;
        // this.score_multiplier = 1;
        // this.score_multiplier_max = 5;
        // this.score_multiplier_growth_rate = .05;
        // this.score_multiplier_decay_rate = .01;
        // this.score_multiplier_decay_delay = 1000; // ms
        // this.score_multiplier_decay_delay_counter = 0;

        this.bullet_count_max = 20;
    }

    draw(offset_x, offset_y) {
        super.draw(offset_x, offset_y);
        this.context.font = '24px serif';
        this.context.fillStyle = 'black';
        this.context.textAlign = 'center';
        let pos_x = this.x + offset_x;
        let pos_y = this.y + offset_y;
        this.context.fillText(this.player_name, pos_x, pos_y - this.radius - 7);
    }
}

class GameObstacle {
    // An immovable object that can be collided with
    constructor(context, type, shape, color) {
        this.context = context;
        this.type = type;
        this.shape = shape;
        // this.x = x;
        // this.y = y;
        this.color = color;
    }    
}

class Bumper extends GameObstacle {
    constructor(context, pt1, pt2, pt3, bump_right, bump_down, color) {
        super(context, 'bumper', 'triangle', color);
        this.pt1 = pt1;
        this.pt2 = pt2;
        this.pt3 = pt3;
        this.bump_right = bump_right; // if true, the bumper will push entities to the right, otherwise to the left
        this.bump_down = bump_down; // if true, the bumper will push entities down, otherwise up
    }

    draw(offset_x, offset_y) {
        this.context.fillStyle = this.color;
        this.context.beginPath();
        this.context.moveTo(this.pt1[0] + offset_x, this.pt1[1] + offset_y);
        this.context.lineTo(this.pt2[0] + offset_x, this.pt2[1] + offset_y);
        this.context.lineTo(this.pt3[0] + offset_x, this.pt3[1] + offset_y);
        this.context.fill();
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
        if (Math.abs(this.x - MAP_WIDTH/2) < Math.max(this.diameter, 1)) {
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

    draw(offset_x, offset_y) {
        let pos_x = this.x + offset_x;
        let pos_y = this.y + offset_y;

        this.context.beginPath();
        this.context.arc(pos_x, pos_y, this.diameter/2, 0, 2 * Math.PI, false);
        this.context.fillStyle = this.color;
        this.context.fill();
        this.context.lineWidth = 1;
        this.context.strokeStyle = '#003300';
        this.context.stroke();

        this.context.font = '14px serif';
        this.context.fillStyle = 'black';
        this.context.textAlign = 'center';
        this.context.fillText(Math.round(this.ore), pos_x, pos_y);

    }

    bouncy_wall_check() {
        if (this.x < this.radius) {
            this.x = this.radius;
            this.v_x *= -.05;
            this.acc_x *= -.2;
        }
        if (this.x + this.radius > MAP_WIDTH) {
            this.x = MAP_WIDTH - this.radius;
            this.v_x *= -.05;
            this.acc_x *= -.2;
        }
        if (this.y < this.radius) {
            this.y = this.radius;
            this.v_y *= -.5;
            this.acc_y *= -.2;
        }
        if (this.y + this.radius > MAP_HEIGHT) {
            this.y = MAP_HEIGHT - this.radius;
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
        if (this.x >= MAP_WIDTH - END_ZONE_WIDTH) { //TODO magic number
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


// context, x, y, color, ore_points_initial, ore_points_max
class OrePellet extends Ore {
    constructor(context, x, y, color) {
        let diameter = 10;
        super(context, x, y, color, 10, 20);
        this.type = 'ore_pellet';
        this.max_acc_x = 0;
        this.max_acc_y = 0;
        this.max_v_x = 0;
        this.max_v_y = 0;
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

        this.num_bots_team_1 = 0;
        this.num_bots_team_2 = 0;
        this.num_bots = 0; // will be incremented in add_bot() // this.num_bots_team_1 + this.num_bots_team_2;
        
        this.num_ore = 5;

        this.offside_punishment_rate = .00125;
        this.bullet_cost = 3;

        this.points_to_win = 500; 

        this.view_follows_player = false;
        this.offset_x = 0; // set in render_board depending on view_follows_player
        this.offset_y = 0; // set in render_board


        this.obstacles = {};
        this.obstacles['bumper1'] = new Bumper(context, [0,0], [0, END_ZONE_WIDTH/2], [END_ZONE_WIDTH/2, 0], true, true, '#888888');
        this.obstacles['bumper2'] = new Bumper(context, [0,MAP_HEIGHT], [0,MAP_HEIGHT - END_ZONE_WIDTH/2], [END_ZONE_WIDTH/2, MAP_HEIGHT], true, false, '#888888');
        this.obstacles['bumper3'] = new Bumper(context, [MAP_WIDTH,0], [MAP_WIDTH, END_ZONE_WIDTH/2], [MAP_WIDTH - END_ZONE_WIDTH/2, 0], false, true, '#888888');
        this.obstacles['bumper4'] = new Bumper(context, [MAP_WIDTH,MAP_HEIGHT], [MAP_WIDTH,MAP_HEIGHT - END_ZONE_WIDTH/2], [MAP_WIDTH - END_ZONE_WIDTH/2, MAP_HEIGHT], false, false, '#888888');

        this.entities = {};
        this.entities['player'] = new GamePlayer(context, 'Player 1', END_ZONE_WIDTH, MAP_HEIGHT/2, '#FF6666');
        // this.entities[] = new Square(context, 0, 0, 20, 20, '#DD0000');
        
        this.entities['ore1'] = new Ore(context, MAP_WIDTH/2, 150, '#00BBBB', .1, 75);
        this.entities['ore2'] = new Ore(context, MAP_WIDTH/2, 300, '#00BBBB', .1, 50);
        this.entities['ore3'] = new Ore(context, MAP_WIDTH/2, MAP_HEIGHT/2, '#00BBBB', .1, 100);
        this.entities['ore4'] = new Ore(context, MAP_WIDTH/2, MAP_HEIGHT - 300, '#00BBBB', .1, 50);
        this.entities['ore5'] = new Ore(context, MAP_WIDTH/2, MAP_HEIGHT - 150, '#00BBBB', .1, 75);
        
        this.entities['ore_pellet1'] = new OrePellet(context, 100, 100, '#00BBBB');

        for (let i = 1; i <= this.num_bots_team_1; i++) {
            this.add_bot(context, false)
        }
        for (let i = 1; i <= this.num_bots_team_2; i++) {
            this.add_bot(context, true)
        }
        
    }

    add_bot(context, is_on_right_side) {
        let starting_x;
        let starting_y;
        let color;
        this.num_bots += 1;

        if (is_on_right_side) {
            starting_x = MAP_WIDTH - END_ZONE_WIDTH + PLAYER_DIAMETER;
            starting_y = Math.random()*MAP_HEIGHT;
            color = '#0000DD';

        } else {
            starting_x = END_ZONE_WIDTH;
            starting_y = Math.random()*MAP_HEIGHT;
            color = '#DD0000';
        }
        this.entities['bot' + this.num_bots] = new DumbBot(context, 'Bot ' + this.num_bots, starting_x, starting_y, color, is_on_right_side);
    }

    game_continues() { 
        // Return true if the game is still going
        // Return false if the game is over
        if (this.score_team_1 >= this.points_to_win | this.score_team_2 >= this.points_to_win) {
            render_game_over();
            return false;
        }
    
        return true;
    
    }

    game_loop_client() {
        if (game.game_continues()) {
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

            this.last_update = Date.now();
        }
        
        setTimeout( () => { window.requestAnimationFrame(() => this.game_loop_client()); }, RENDER_REFRESH_TIME) // therefore each game loop will last at least tick_time ms    
    }

} // END of NewGamePlus class

class DumbBot extends GamePlayer {
    constructor(context, id, x, y, color, is_on_right_side) {
        super(context, id, x, y, color);
        // this.team = 
        this.is_on_right_side = is_on_right_side;
        this.homing_target = 'ore1';
        this.shot_target = 'ore3';
        // this.set_homing_target();
        
    }
    make_a_move() {
        let distance_x = game.entities[this.homing_target].x - this.x;
        let distance_y = game.entities[this.homing_target].y - this.y;
        let distance = Math.sqrt(distance_x**2 + distance_y**2);

        if (Math.abs(distance) < this.radius + game.entities[this.homing_target].radius + 5 | Math.random() > .95) {
        // if (Math.abs(distance) < this.radius + game.entities[this.homing_target].radius + 5 ) {
            // this.set_target(Math.random()*MAP_WIDTH, Math.random()*MAP_HEIGHT);
            // this.set_random_target();
            this.set_homing_target();
            distance_x = game.entities[this.homing_target].x - this.x;
            distance_y = game.entities[this.homing_target].y - this.y;
            
            if (this.is_on_right_side) { 
                distance_x += game.entities[this.homing_target].radius; // aim to the right of the target
            } else {
                distance_x -= game.entities[this.homing_target].radius; // aim to the left of the target
            }
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

        if (Math.random() > .9975) {
            this.set_shot_target();
            // console.log('shoot')
            let distance_x = game.entities[this.shot_target].x - this.x;
            let distance_y = game.entities[this.shot_target].y - this.y;
            let bullet_angle = Math.atan2(distance_y, distance_x);
            
            // Set the lead distance using the target's velocity (and maybe later their acc)
            // "Bullet flight time to target times speed of target will give you the lead distance.""
            let lead_distance_x = distance_x/(BULLET_SPEED * Math.cos(bullet_angle))*game.entities[this.shot_target].v_x;
            let lead_distance_y = distance_y/(BULLET_SPEED * Math.sin(bullet_angle))*game.entities[this.shot_target].v_y;
            
            let dest_x = game.entities[this.shot_target].x + lead_distance_x;
            let dest_y = game.entities[this.shot_target].y + lead_distance_y;

            if (this.is_on_right_side) {
                dest_x += game.entities[this.shot_target].radius; // aim to the right of the target
            } else {
                dest_x -= game.entities[this.shot_target].radius; // aim to the left of the target
            }
            // bullet_angle = Math.atan2(distance_y, distance_x); // adjust with lead distance
            
            // distance_x += game.entities[this.shot_target].radius; // aim to the right of the target

            // if (game.entities[this.shot_target].v_x > 0) {
            //     lead_distance_x = game.entities[this.shot_target].v_x * 10;
            

            if((this.is_on_right_side & game.score_team_2 >= game.bullet_cost & distance_x < -1*game.entities[this.shot_target].radius) | (!this.is_on_right_side & game.score_team_1 >= game.bullet_cost & distance_x > game.entities[this.shot_target].radius)){
                bullet_id_counter += 1;
                game.entities[bullet_id_counter] = new OreBullet(game.canvas.getContext('2d'), this.entity_id, this.x, this.y, dest_x, dest_y, 10, 10, this.color);
                
                if(this.is_on_right_side) {
                    game.score_team_2 -= game.bullet_cost; //TODO magic number
                } else {
                    game.score_team_1 -= game.bullet_cost; //TODO magic number
                };

                console.log('shot fired ' + bullet_id_counter + ' at ' + Math.round(dest_x) + ', ' + Math.round(dest_y));
                console.log('target is ' + this.shot_target + ' at ' + Math.round(game.entities[this.shot_target].x) + ', ' + Math.round(game.entities[this.shot_target].y));
            }
        }
    }

    set_target(entity_id) {
        this.homing_target = entity_id;
        // this.homing_target_original_distance_x = this.x - game.entities[this.homing_target].x;
        // this.homing_target_original_distance_y = this.y - game.entities[this.homing_target].y;
        // console.log('Target set to ' + game.entities[this.homing_target].x + ', ' + game.entities[this.homing_target].y);
    }

    // set_random_target() {
    //     //pick a target that is within the bounds of the canvas
    //     let target = Math.floor(Math.random()*5)+2;
    //     // this.set_target(game.entities[target].x, game.entities[target].y);
    //     this.set_target(target);
        
    // }
    set_shot_target() {
        //who to aim for
        //TODO
        let target_weights = [0, 0, 0, 0, 0];
        let target_option_ids = ['ore1', 'ore2', 'ore3', 'ore4', 'ore5'];
        for (let i = 0; i < target_weights.length; i++) {
            let dist = 1 / (Math.sqrt((game.entities['ore' + (i + 1)].x - this.x)**2 + (game.entities['ore' + (i + 1)].y - this.y)**2)/canvas.width);
            dist *= game.entities['ore' + (i + 1)].ore**2;
            target_weights[i] = dist;
        }
        console.log(target_weights)
        this.shot_target = target_option_ids[target_weights.indexOf(Math.max(...target_weights))];
    }
    set_homing_target() {
        // consider the distance to each ore, the relative size of the ore, and whether or not the ore is to the left or right of the player
        // TODO
        let target_weights = [0.00001, 0, 0, 0, 0];
        let target_option_ids = ['ore1', 'ore2', 'ore3', 'ore4', 'ore5'];
        
        target_weights[0] = (1/Math.sqrt((game.entities['ore1'].x - this.x)**2 + (game.entities['ore1'].y - this.y)**2))*(game.entities['ore1'].ore**3)//; *(this.x - game.entities[2].x);
        target_weights[1] = (1/Math.sqrt((game.entities['ore2'].x - this.x)**2 + (game.entities['ore2'].y - this.y)**2))*(game.entities['ore2'].ore**3)//; *(this.x - game.entities[3].x);
        target_weights[2] = (1/Math.sqrt((game.entities['ore3'].x - this.x)**2 + (game.entities['ore3'].y - this.y)**2))*(game.entities['ore3'].ore**3)//; *(this.x - game.entities[4].x);
        target_weights[3] = (1/Math.sqrt((game.entities['ore4'].x - this.x)**2 + (game.entities['ore4'].y - this.y)**2))*(game.entities['ore4'].ore**3)//; *(this.x - game.entities[5].x);
        target_weights[4] = (1/Math.sqrt((game.entities['ore5'].x - this.x)**2 + (game.entities['ore5'].y - this.y)**2))*(game.entities['ore5'].ore**3)//; *(this.x - game.entities[6].x);
        
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


function render_game_over() {
    console.log('render_game_over() called');
    let context = game.canvas.getContext('2d');
    
    // canvas.style.backgroundColor = 'black';
    //Clear the center of the canvas
    context.clearRect(canvas.width/2 - 200, canvas.height/2 - 100, 400, 200);
    context.font = '48px serif';

    if (game.score_team_1 > game.score_team_2) {
        context.fillStyle = '#DD0000';
        context.textAlign = 'center';
        context.fillText('Team 1 Wins!', canvas.width/2, canvas.height/2);
    } else {
        context.fillStyle = '#0000DD';
        context.fillText('Team 2 Wins!', canvas.width/2, canvas.height/2);
    }

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

    if (game.entities['player'].x > MAP_WIDTH/2) {
        game.score_team_1 -= game.offside_punishment_rate*(Date.now() - game.last_update);
        if(game.score_team_1 < 0) {
            game.score_team_1 = 0;
        }
    }

    for (let i = 1; i <= game.num_bots; i++) {
        if (game.entities['bot' + i].is_on_right_side) {
            if (game.entities['bot' + i].x < MAP_WIDTH/2) {
                game.score_team_2 -= game.offside_punishment_rate*(Date.now() - game.last_update);
                if(game.score_team_2 < 0) {
                    game.score_team_2 = 0;
                }
            }
        } else {
            if (game.entities['bot' + i].x > MAP_WIDTH/2) {
                game.score_team_1 -= game.offside_punishment_rate*(Date.now() - game.last_update);
                if(game.score_team_1 < 0) {
                    game.score_team_1 = 0;
                }
            }
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
    } else if ((entity1.shape == 'circle') && entity2.shape == 'triangle') {
        return circle_triangle_collision_check(entity1, entity2);
    } else if ((entity1.shape == 'square') && entity2.shape == 'triangle') {
        return square_triangle_collision_check(entity1, entity2);
    
    } else {

        // console.log('check!')
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

function point_square_collision_check(square, point) {
    //TODO
    //Check if a point is inside of a square
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

    return false;
}
function square_triangle_collision_check(entity, triangle) {
    //TODO


    return false;

}

function circle_triangle_collision_check(entity, triangle) {
    //if the equation of the line is ax+by+c=0, then a point x0, y0 has distance (ax0+by0+c)/sqrt(a^2+b^2) from the line
    //to get the equation of the line: Find the slope using the slope formula
    //slope = (y2 - y1)/(x2 - x1)
    //Use the slope and one of the points to solve for the y-intercept (b)
        // One of your points can replace the x and y, and the slope you just calculated replaces the m of your equation y = mx + c. Then b is the only variable left. Use the tools you know for solving for a variable to solve for b.
    //Once you know the value for m and the value for b, you can plug these into the slope-intercept form of a line (y = mx + c) to get the equation for the line.
    let line_collision_count = 0;

    // console.log('circle_triangle_collision_check() called');

    // if (entity.x > END_ZONE_WIDTH) { return false};
    let d1 = 0
    let d3 = 0;
    // //check points 1-2
    // let m1 = (triangle.pt2[1] - triangle.pt1[1])/(triangle.pt2[0] - triangle.pt1[0]+.0000001);
    // let b1 = triangle.pt1[1] - m1*triangle.pt1[0];
    // let d1 = (m1*entity.x -1*entity.y + b1)/(Math.sqrt(m1**2 + 1));
    // //console.log(Math.round(entity.x) + ', ' + Math.round(entity.y) + ' distance ' + d1);
    // if (Math.abs(d1) <= entity.radius) { 
    //     line_collision_count += 1
    // }

    //check points 2-3
    let m2 = (triangle.pt3[1] - triangle.pt2[1])/(triangle.pt3[0] - triangle.pt2[0]+.0000001);
    let b2 = triangle.pt2[1] - m2*triangle.pt2[0];
    let d2 = (m2*entity.x -1*entity.y + b2)/(Math.sqrt(m2**2 + 1));
    if (Math.abs(d2) <= entity.radius) { 
        line_collision_count += 1
    }

    // //check points 3-1
    // let m3 = (triangle.pt1[1] - triangle.pt3[1])/(triangle.pt1[0] - triangle.pt3[0]+.0000001);
    // let b3 = triangle.pt3[1] - m3*triangle.pt3[0];
    // let d3 = (m3*entity.x -1*entity.y + b3)/(Math.sqrt(m3**2 + 1));
    // if (Math.abs(d3) <= entity.radius) { 
    //     line_collision_count += 1
    // }

    // console.log(Math.abs(Math.round(d1)), Math.abs(Math.round(d2)), Math.abs(Math.round(d3)), line_collision_count)
    
    return line_collision_count > 0; //TODO
}


function collision_detection_update() {
    let collisions = [];
    
    let array_of_entities = Object.values(game.entities);
    let array_of_obstacles = Object.values(game.obstacles);
        
    for (let i = 0; i < array_of_entities.length; i++) {
        //Check for collisions between each entity and every other entity
        for (let j = i + 1; j < array_of_entities.length; j++) {
            if (check_if_collision(array_of_entities[i], array_of_entities[j])) {
                collisions.push([array_of_entities[i], array_of_entities[j]]);
                // console.log('collision detected')
            }
        }

        //Check for collisions between each entity and every obstacle
        for (let k = 0; k < array_of_obstacles.length; k++) {
            if (check_if_collision(array_of_entities[i], array_of_obstacles[k])) {
                collisions.push([array_of_entities[i], array_of_obstacles[k]]);
                // console.log('collision detected')
            }
        }
    }

    return collisions;
}

function resolve_collisions(collisions) {   
    for (let i = 0; i < collisions.length; i++) {

        // console.log('Resolving collision between ' + collisions[i][0].type + ' and ' + collisions[i][1].type);

        if(collisions[i][1].type == 'bumper') {
            // Bumper stays put, entity bounces off of it with a new velocity
            // TODO
            let entity1 = collisions[i][0];
            let bumper = collisions[i][1];
            if (bumper.bump_right) {
                entity1.v_x = 1*Math.abs(entity1.v_x);
            } else {
                entity1.v_x = -1*Math.abs(entity1.v_x);
            }
            if (bumper.bump_down) {
                entity1.v_y = 1*Math.abs(entity1.v_y);
            } else {
                entity1.v_y = -1*Math.abs(entity1.v_y);
            }           


        } else {

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
        };
    }
}




function render_board() {    
    //console.log('render_board()')
    let canvas = document.getElementById('gameCanvas');
    let context = canvas.getContext('2d');

    context.fillStyle= '#777777';  
    context.fillRect(0, 0, canvas.width, canvas.height); // Clear the board
    context.stroke();
    

    if (game.view_follows_player) {
        let pos_player_x = game.entities['player'].x;
        let pos_player_y = game.entities['player'].y;

        game.offset_x = canvas.width/2 - pos_player_x;
        game.offset_y = canvas.height/2 - pos_player_y;
    } else {
        game.offset_x = 0;
        game.offset_y = 0;    
    }

    let offset_x = game.offset_x;
    let offset_y = game.offset_y;

    console.log(offset_x, offset_y)

    context.fillStyle= '#CCCCCC';  
    context.fillRect(offset_x, offset_y, MAP_WIDTH + Math.max(offset_x, 0), MAP_HEIGHT + Math.max(offset_y, 0));
    context.stroke();
    

    context.fillStyle='#FFCCCC'; // red background on the left
    context.fillRect(offset_x, offset_y, MAP_WIDTH/2  + Math.max(offset_x, 0), MAP_HEIGHT + Math.max(offset_y, 0)); 
    context.stroke();
    console.log('umm', Math.max(MAP_WIDTH/2 + offset_x, 0), MAP_HEIGHT + Math.max(offset_y, 0))

    context.fillStyle='#CCCCFF'; // blue background on the right
    context.fillRect(MAP_WIDTH/2+offset_x, offset_y, MAP_WIDTH/2 + Math.max(offset_x, 0), MAP_HEIGHT + Math.max(offset_y, 0));
    context.stroke();

    // Draw the grid
    context.strokeStyle = '#888888';
    context.lineWidth = 1;
    for (let i = 0; i < MAP_WIDTH; i += BG_GRID_SIZE) {
        context.beginPath();
        context.moveTo(i+offset_x, offset_y);
        context.lineTo(i+offset_x, MAP_HEIGHT + offset_y);
        context.stroke();
    }
    for (let i = 0; i < MAP_HEIGHT; i += BG_GRID_SIZE) {
        context.beginPath();
        context.moveTo(offset_x, i + offset_y);
        context.lineTo(MAP_WIDTH + offset_x, i + offset_y);
        context.stroke();
    }

    


    // Color the end zones
    context.fillStyle = '#6666FF';
    context.fillRect(offset_x, offset_y, END_ZONE_WIDTH, MAP_HEIGHT + Math.max(offset_y, 0));
    context.fillStyle = '#FF6666';
    context.fillRect(offset_x + MAP_WIDTH-END_ZONE_WIDTH, offset_y, END_ZONE_WIDTH + Math.max(offset_x, 0), MAP_HEIGHT + Math.max(offset_y, 0));

    
    // Draw all obstacles on the canvas
    for (let key in game.obstacles) {
        game.obstacles[key].draw(offset_x, offset_y);
    }

    //Draw goal lines
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.beginPath(); // left goal line
    context.moveTo(END_ZONE_WIDTH + offset_x, offset_y);
    context.lineTo(END_ZONE_WIDTH + offset_x, MAP_HEIGHT + offset_y);
    context.stroke();
    context.beginPath(); // right goal line
    context.moveTo(MAP_WIDTH-END_ZONE_WIDTH + offset_x, offset_y);
    context.lineTo(MAP_WIDTH-END_ZONE_WIDTH + offset_x, MAP_HEIGHT + offset_y);
    context.stroke();
    context.beginPath(); // middle border
    context.moveTo(MAP_WIDTH/2 + offset_x, offset_y);
    context.lineTo(MAP_WIDTH/2 + offset_x, MAP_HEIGHT + offset_y);
    context.stroke();

    context.lineWidth = 5;
    context.beginPath(); // outer border left right up down
    context.moveTo(offset_x, offset_y);
    context.lineTo(offset_x, MAP_HEIGHT + offset_y);
    context.lineTo(offset_x + MAP_WIDTH, MAP_HEIGHT + offset_y);
    context.lineTo(offset_x + MAP_WIDTH, offset_y);
    context.lineTo(offset_x, offset_y);
    
    context.stroke();


    
    // Draw each entity on the canvas
    for (let key in game.entities) {
        game.entities[key].draw(offset_x, offset_y);
    }

    

}

function render_score() {
    let scoreDivLeft = document.getElementById('scoreDivLeft');
    let scoreDivRight = document.getElementById('scoreDivRight');
    scoreDivLeft.innerHTML = 'Score: ' + Math.floor(game.score_team_1);
    scoreDivRight.innerHTML = 'Score: ' + Math.floor(game.score_team_2);


}


loadApp();
game.game_loop_client();