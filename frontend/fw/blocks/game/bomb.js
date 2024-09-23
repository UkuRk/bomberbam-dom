import Component from "../component.js";
import { initCrossBlast } from "../movement-impact.js";
import { checkTrigger } from "./collisions.js";
import TabSprite from "./sprite.js";

const keys = ["top", "left", "in", "right", "bottom"];
const yellowFlammeSprite = new TabSprite("./fw/blocks/game/media/blast-jaune-32x32.png", 32, 128, 288).tab;
const blueFlammeSprite = new TabSprite("./fw/blocks/game/media/blast-bleu-32x32.png", 32, 128, 288).tab;
const ANIMATION_FRAME_BOMB = {
    0: { tab: [0, 1, 2], flame: "yellow", blastRange: 1, bombTimer: 1500, blastTimer: 1000 },
    1: { tab: [3, 4, 5], flame: "yellow", blastRange: 1, bombTimer: 1500, blastTimer: 1000 },
    2: { tab: [6, 7, 8], flame: "blue", blastRange: 1, bombTimer: 1500, blastTimer: 1000 },
    3: { tab: [9, 10, 11], flame: "yellow", blastRange: 1, bombTimer: 1500, blastTimer: 1000 },
    4: { tab: [12, 13, 14], flame: "blue", blastRange: 38, bombTimer: 500, blastTimer: 1000 },
};

const ANIMATION_FRAME_BLAST = {
    "in": {
        end: [0, 9, 18, 27],
    },
    "top": {
        mid: [1, 10, 19, 28],
        end: [2, 11, 20, 29],
    },
    "left": {
        mid: [3, 12, 21, 30],
        end: [4, 13, 22, 31],
    },
    "bottom": {
        mid: [5, 14, 23, 32],
        end: [6, 15, 24, 33],
    },
    "right": {
        mid: [7, 16, 25, 34],
        end: [8, 17, 26, 35],
    }
};

export default class TabBomb extends Component {
    constructor(parent, currentPlayer) {
        super("div", { id: "TabBomb" }, []);
        this.tabSpriteBomb = new TabSprite("./fw/blocks/game/media/bomb-32x32.png", 32, 160, 96).tab;
        this.parent = parent;
        this.currentPlayer = currentPlayer;
        this.boundUpdate = this.update.bind(this);
        this.bombPool = new BombPool();
    }

    newBomb(BombMessage) {
        const bombSprite = ANIMATION_FRAME_BOMB[BombMessage.bombType].tab.map(idsprite => this.tabSpriteBomb[idsprite]);

        let bomb = this.bombPool.getBomb(
            BombMessage.bombType,
            BombMessage.sender,
            BombMessage.position.x,
            BombMessage.position.y,
            BombMessage.date,
            bombSprite,
            BombMessage.blastRangeBonus + ANIMATION_FRAME_BOMB[BombMessage.bombType].blastRange,
            this,
        );

        this.addElement(bomb);
        this.update();
    }

    //  Update the bombs and blasts in the component
    tick(deltaTime) {
        let tabExplodeBomb = [];
        const newChild = this.children.filter((child) => {
            if (child.tick(deltaTime)) {
                if (child instanceof Bomb) tabExplodeBomb.push(child);
                return false;
            } else {
                return true;
            }
        });

        if (newChild.length !== this.children.length) {
            this.children = newChild;
            tabExplodeBomb.forEach((bomb) => {
                if (this.currentPlayer.username === bomb.sender) this.currentPlayer.bombExplode();
                this.addElement(new Blast(bomb.posX, bomb.posY, ANIMATION_FRAME_BOMB[bomb.bombType].flame, bomb.blastRange, ANIMATION_FRAME_BOMB[bomb.bombType].blastTimer, this));
            });

            this.children.forEach((child) => {
                if (child.dirty) {
                    this.update();
                    child.dirty = false;
                }
            })
            requestAnimationFrame(this.boundUpdate)
        }
    }
    returnBomb() {
        return this.children.filter((child) => child instanceof Bomb);
    }
}

class Bomb extends Component {
    constructor(bombType, sender, posX, posY, date, spriteAnimation, blastRange, parent, fuseTime = 3000) {
        super(
            "div",
            {
                id: `${sender}-bomb`,
                class: "bomb",
            },
            []
        );
        this.parent = parent;
        this.bombType = bombType;
        this.sender = sender;
        this.posX = parseInt((posX + 16) / 32) * 32;
        this.posY = parseInt((posY + 26) / 32) * 32;
        this.dateCreateBomb = date;
        this.blastRange = blastRange;
        this.animationId = 0;
        this.props.style = `${spriteAnimation[0].style} transform: translate(${this.posX}px, ${this.posY}px);`;
        this.spriteAnimation = spriteAnimation;
        this.spriteAnimationLength = spriteAnimation.length;
        this.timer = 0
        this.bombTimer = parseInt(ANIMATION_FRAME_BOMB[this.bombType].bombTimer / ANIMATION_FRAME_BOMB[this.bombType].tab.length);
        this.boundUpdate = this.update.bind(this);
        this.dirty = true;
        this.fuseTime = fuseTime;
    }

    //  Update the bomb animation frame
    tick(deltaTime) {
        this.timer += deltaTime;
        while (this.timer >= this.bombTimer) {
            this.animationId++;
            this.timer -= this.bombTimer;
            if (this.animationId > this.spriteAnimationLength - 1) {
                this.timer = 0;
                return true;
            } else {
                this.props.style = `${this.spriteAnimation[this.animationId].style} transform: translate(${this.posX}px, ${this.posY}px);`;
                this.dirty = true;
                requestAnimationFrame(this.boundUpdate)
            }
        }
        return false;
    }
    reset(bombType, sender, posX, posY, date, spriteAnimation, blastRange, parent, fuseTime = 3000) {
        this.parent = parent;
        this.bombType = bombType;
        this.sender = sender;
        this.posX = parseInt((posX + 16) / 32) * 32;
        this.posY = parseInt((posY + 26) / 32) * 32;
        this.dateCreateBomb = date;
        this.blastRange = blastRange;
        this.animationId = 0;
        this.props.style = `${spriteAnimation[0].style} transform: translate(${this.posX}px, ${this.posY}px);`;
        this.spriteAnimation = spriteAnimation;
        this.spriteAnimationLength = spriteAnimation.length;
        this.timer = 0
        this.bombTimer = parseInt(ANIMATION_FRAME_BOMB[this.bombType].bombTimer / ANIMATION_FRAME_BOMB[this.bombType].tab.length);
        this.boundUpdate = this.update.bind(this);
        this.dirty = true;
        this.fuseTime = fuseTime;
    }
}

class Blast extends Component {
    constructor(posX, posY, typeflame, blastRange, timer, parent) {
        super("div", { id: `${parent.props.id}blast` }, []);
        this.dateCreateBomb = Date.now();
        this.posX = posX;
        this.posY = posY;
        this.typeflame = typeflame;
        this.parent = parent;
        this.crossElement = [];
        this.animationId = 0;
        this.blastRange = blastRange;
        this.timer = parseInt(timer / 4);
        this.deltaTime = this.deltaTime
        this.aLive = Date.now();
        this.boundUpdate = this.update.bind(this);
        this.initBlast();
    }

    initBlast() {
        const map = this.parent.parent;
        const cross = initCrossBlast(this.posX, -this.posY, map, this.blastRange);
        keys.forEach(key => {
            cross[key].forEach((blockBorder, index) => {
                let spkey = index < cross[key].length - 1 ? "mid" : "end";
                const spriteAnimation = [];
                const animationLength = ANIMATION_FRAME_BLAST[key][spkey].length;
                for (let i = 0; i < animationLength; i++) {
                    spriteAnimation.push(this.typeflame === "yellow" ? yellowFlammeSprite[ANIMATION_FRAME_BLAST[key][spkey][i]] : blueFlammeSprite[ANIMATION_FRAME_BLAST[key][spkey][i]]);
                }
                this.addElement(new Fire(blockBorder.borderLeft, blockBorder.borderUp, spriteAnimation, blockBorder, this.parent, key));
                if (blockBorder.type === "block") {
                    const top = map.children[blockBorder.indexY - 1].children[blockBorder.indexX];
                    const bottom = map.children[blockBorder.indexY + 1].children[blockBorder.indexX];
                    map.children[blockBorder.indexY].children[blockBorder.indexX] = top.props.class === "block" || top.props.class === "wall" ? map.shadow : map.path;
                    if (bottom.props.class === "shadow") map.children[blockBorder.indexY + 1].children[blockBorder.indexX] = map.path;
                    map.update();
                }
                if (blockBorder.type === "covered") {
                    const bonus = map.children[blockBorder.indexY].children[blockBorder.indexX];
                    for (let i = 0; i < bonus.children.length; i++) {
                        if (bonus.children[i].props.class === "block-cover") {
                            bonus.children.splice(i, 1);
                            bonus.props.class = "bonus";
                            break;
                        }
                    }
                    map.update();
                }
            });
        });
    }

    tick() {
        const time = Date.now();
        let updateFrame = false;
        if (time - this.aLive >= this.timer) {
            updateFrame = true;
            this.aLive = time;
        }
        if (updateFrame) {
            if (this.animationId >= 3) {
                return true;
            } else {
                this.animationId++;
                this.children.forEach(fire => fire.tick(this.animationId));
                requestAnimationFrame(this.boundUpdate);
            }
        }
        return false;
    }
}

class Fire extends Component {
    constructor(posX, posY, spriteAnimation, border, parent, key) {
        super("div", { class: "fire" }, []);
        this.posX = posX;
        this.posY = posY;
        this.spriteAnimation = spriteAnimation;
        this.spriteAnimationLength = spriteAnimation.length;
        this.border = border;
        this.parent = parent;
        this.key = key;
        this.props.style = `${this.spriteAnimation[0].style} transform: translate(${this.posX}px, ${this.posY}px);`;
        this.lastAnimationId = 0;
        this.dirty = true;
    }

    tick(animationId) {
        const newStyle = `${this.spriteAnimation[animationId].style} transform: translate(${this.posX}px, ${this.posY}px);`;
        if (animationId !== this.lastAnimationId && animationId < this.spriteAnimationLength && this.props.style !== newStyle) {
            this.props.style = newStyle;
            this.lastAnimationId = animationId;
            this.dirty = true;
        }
        const currentPlayer = this.parent.currentPlayer;
        if (checkTrigger(currentPlayer, this.border)) {
            currentPlayer.triggerBlast();
        }
    }
}

class BombPool {
    constructor() {
        this.pool = [];
    }

    create(bombType, sender, posX, posY, date, spriteAnimation, blastRange, parent, fuseTime = 3000) {
        let bomb = new Bomb(bombType, sender, posX, posY, date, spriteAnimation, blastRange, parent, fuseTime);
        this.pool.push(bomb);
        return bomb;
    }

    getBomb(bombType, sender, posX, posY, date, spriteAnimation, blastRange, parent, fuseTime = 3000) {
        if (this.pool.length > 10) {
            const bomb = this.pool.shift();
            bomb.reset(bombType, sender, posX, posY, date, spriteAnimation, blastRange, parent, fuseTime);
            return bomb;
        } else {
            return this.create(bombType, sender, posX, posY, date, spriteAnimation, blastRange, parent, fuseTime);
        }
    }
}