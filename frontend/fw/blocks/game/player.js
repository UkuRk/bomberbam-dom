import Component from "../component.js";
import { checkGround, checkTrigger } from "./collisions.js";


const FRAME_COUNT = 3;
const FRAME_WIDTH = 32;
const MOVEMENT_SIZE = 2;
const ANIMATION_FRAME_RATE = 8;

// Animation frames for different directions
const ANIMATION_FRAMES = {
    "down": Array.from({ length: FRAME_COUNT }, (_, i) => ({ offsetX: i * FRAME_WIDTH, offsetY: 0 })),
    "up": Array.from({ length: FRAME_COUNT }, (_, i) => ({ offsetX: i * FRAME_WIDTH, offsetY: FRAME_WIDTH })),
    "right": Array.from({ length: FRAME_COUNT }, (_, i) => ({ offsetX: (i + 3) * FRAME_WIDTH, offsetY: 0 })),
    "left": Array.from({ length: FRAME_COUNT }, (_, i) => ({ offsetX: (i + 3) * FRAME_WIDTH, offsetY: FRAME_WIDTH }))
};

// Mapping of key codes to directions
const DIRECTION_MAP = {
    "ArrowUp": "up",
    "w": "up",
    "ArrowDown": "down",
    "s": "down",
    "ArrowLeft": "left",
    "a": "left",
    "ArrowRight": "right",
    "d": "right"
};

// Mapping of keys to drop bomb action
const DROP_BOMB = {
    "Shift": true,
    " ": true
};

// Player class
export class Player extends Component {
    constructor(props, ws, username) {
        super("div", props);
        this.ws = ws;
        this.username = username;
        this.posX = props.style.left;
        this.posY = props.style.top;
        this.sprite = `url(./fw/blocks/game/media/player${props.index + 1}.png)`;
        this.props.style = `background-image: ${this.sprite}; background-position: -${0}px -${0}px;`;
        this.life = 3;
        this.draw();

        this.frameIndex = 0;
        this.animationCounter = 0;
        this.frameCycle = [0, 1, 0, 2];
        this.cycleIndex = 0;
    }


    draw() {
        this.props.style = `${this.props.style} transform: translate(${this.posX}px, ${this.posY}px);`;
    }

    animate(direction) {
        this.animationCounter++;
        if (this.animationCounter % ANIMATION_FRAME_RATE === 0 || direction !== this.prevDirection) {
            this.prevDirection = direction;
            this.frameIndex = this.frameCycle[this.cycleIndex];
            this.cycleIndex = (this.cycleIndex + 1) % this.frameCycle.length;
        }
    }

    move(direction, position) {
        this.posX = position.x;
        this.posY = position.y;
        this.animate(direction);
        const { offsetX, offsetY } = ANIMATION_FRAMES[direction][this.frameIndex];
        this.props.style = `${this.props.style} transform: translate(${this.posX}px, ${this.posY}px); background-position: -${offsetX}px -${offsetY}px;`;
        this.updateStyle(this.props.style);
    }

    die() {
        this.props.style = `${this.props.style} opacity: 0.4;`
        this.updateStyle(this.props.style);

    }
}

export class CurrentPlayer extends Player {
    constructor(props, ws, username, parent) {
        super(props, ws, username);
        this.direction = null;
        this.isMoving = false;
        this.parent = parent;
        this.frameID = null;
        this.lock = false;
        this.bombCooldown = 0;
        this.maxBombNumber = 1;
        this.bombNumber = 0;
        this.bombType = 0;
        this.blastRangeBonus = 0;
        this.cooldownDegats = 0;
        this.isAlive = true;
        this.canEscape = false;
        this.speed = MOVEMENT_SIZE;

        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        }


        this.ws.onMessage((message) => {
            if (message.type === "lock") {
                this.lock = true;
            } else if (message.type === "unlock") {
                this.lock = false;
            }
        });

        window.addEventListener("keydown", ((event) => {
            const direction = DIRECTION_MAP[event.key];
            const dropBomb = DROP_BOMB[event.key];

            if (direction && !this.lock) {
                this.keys[direction] = true;
                if (!this.isMoving) {
                    this.direction = direction;
                    this.updatePosition();
                }
            }

            if (dropBomb && ((this.bombCooldown - Date.now() <= 0) || this.bombNumber < this.maxBombNumber) && this.isAlive && !this.lock) {
                this.bombNumber++;
                this.dropBomb();
                this.bombCooldown = Date.now() + 1500;
            }
        }));

        window.addEventListener("keyup", ((event) => {
            const direction = DIRECTION_MAP[event.key];
            if (direction) {
                this.direction = null;
                this.keys[direction] = false;
            }
        }));
    }

    addMaxBombNumber() {
        this.maxBombNumber++;
    }

    rmMaxBombNumber() {
        this.maxBombNumber--;
    }

    setBombType(type) {
        this.bombType = type;
    }

    bombExplode() {
        this.bombNumber -= 1;
    }

    addBlastRange(nb) {
        this.blastRangeBonus += nb;
    }

    resetBlastRange() {
        this.blastRangeBonus = 0;
    }

    speedUp() {
        this.speed += 0.2;
    }

    activeEscape() {
        this.canEscape = true;
    }

    addLife(nb) {
        this.life += nb;
    }

    moveCurrent() {
        const playerGround = checkGround(this);
        if (!this.direction) {
            this.isMoving = false;
        }
        const oldPosX = this.posX;
        const oldPosY = this.posY;

        this.parent.bonusMap.forEach((bonus) => {
            if (checkTrigger(this, bonus) && bonus.parent.children.length == 1 && this.isAlive) {
                let bonusData = {
                    bonus: bonus.bonus,
                    indexX: bonus.indexX,
                    indexY: bonus.indexY,
                };

                setTimeout(() => {
                    this.ws.sendMessage({ type: "bonus", sender: this.username, data: bonusData });
                }, 100);

                switch (bonus.bonus) {
                    case "bomb":
                        console.log("bomb");
                        this.addMaxBombNumber();
                        break;
                    case "blast":
                        console.log("blast");
                        this.addBlastRange(1);
                        break;
                    case "speed":
                        console.log("speed");
                        this.speedUp();
                        break;
                    case "escape":
                        console.log("escape");
                        this.activeEscape();
                        break;
                    case "life":
                        console.log("life");
                        this.addLife(1);
                        break;
                    default:
                        break;
                }
                this.parent.bonusMap = this.parent.bonusMap.filter((el) => el != bonus);
            }
        });

        if (this.keys.up) {
            this.direction = "up";
            this.posY += !playerGround.groundUp ? -this.speed : playerGround.up;
        }

        if (this.keys.down) {
            this.direction = "down";
            this.posY += !playerGround.groundDown ? this.speed : playerGround.down;
        }

        if (this.keys.left) {
            this.direction = "left";
            this.posX += !playerGround.groundLeft ? -this.speed : playerGround.left;
        }

        if (this.keys.right) {
            this.direction = "right";
            this.posX += !playerGround.groundRight ? this.speed : playerGround.right;
        }

        if (this.posX !== oldPosX || this.posY !== oldPosY) {
            this.ws.sendMessage({ type: "move", sender: this.username, direction: this.direction, position: { x: this.posX, y: this.posY } });
        }
    }

    updatePosition() {
        this.isMoving = true;
        const oldPosX = this.posX;
        const oldPosY = this.posY;
        this.moveCurrent();
        if (this.posX !== oldPosX || this.posY !== oldPosY) {
            this.frameID = requestAnimationFrame(() => this.updatePosition());
        } else {
            cancelAnimationFrame(this.frameID);
            this.isMoving = false;
        }
    }

    dropBomb() {
        this.ws.sendMessage({
            type: "bomb",
            bombType: this.bombType,
            sender: this.username,
            position: { "x": this.posX, "y": this.posY + 608 },
            date: Date.now(),
            blastRangeBonus: this.blastRangeBonus
        });
    }

    triggerBlast() {
        const time = Date.now();
        if (time - this.cooldownDegats > 1500) {
            this.cooldownDegats = time;
            this.ws.sendMessage({
                type: "degats",
                sender: this.username,
                nb: 1
            });
        }
    }

    playerDeath() {
        this.ws.sendMessage({
            type: "death",
            sender: this.username,
        });
    }
}

class PlayerMove {
    constructor() {
        this.player = null;
        this.direction = null;
        this.position = null;
    }

    setMove(player, direction, position) {
        this.player = player;
        this.direction = direction;
        this.position = position;
    }

    reset() {
        this.player = null;
        this.direction = null;
        this.position = null;
    }
}

export class PlayerMovePool {
    //  Constructs a new PlayerMovePool instance.
    constructor() {
        //  The pool of player moves.
        this.pool = [];
    }

    //  Gets a player move from the pool.
    //  If the pool is empty, a new PlayerMove instance is created.
    getMove(player, direction, position) {
        let move = this.pool.length > 0 ? this.pool.pop() : new PlayerMove();
        move.setMove(player, direction, position);
        return move;
    }

    //  Returns a player move to the pool.
    //  The move is reset before being added back to the pool.
    returnMove(move) {
        move.reset();
        this.pool.push(move);
    }
}