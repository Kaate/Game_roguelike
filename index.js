"use strict";

const field = document.querySelector(".field");
const inventary = document.querySelector(".inventory");
const statistic = document.querySelector(".statistic");
const regenerateBtn = document.querySelector(".regenerate");

const field_height = 24;
const field_weight = 40;
const count_tileHP = 10;
const count_tileSW = 2;
const count_tileE = 10;


let fieldState = new Array(field_height * field_weight)
let personLocations = new Map();

class Game {
    init() {
        createField();
        fillStatistic();
    }
}

class Item {
    className;
    constructor(className) { 
        this.className = className;
    }

    getClass() { return this.className }
}

class Person extends Item {
    health = 100;
    power = 5;
    isDead = false;

    getHealth() { return this.health }
    getPower() { return this.power }
    checkDead() { return this.isDead }
    setPower(newPower) {
        this.power += newPower;
    }
    setHealth(newHealth) {
        this.health += newHealth;
        if (this.health <= 0){
            this.isDead = true;
            return;
        }
        this.health = Math.min(this.health, 100);
    }
    clear() {
        this.isDead = false;
        this.health = 100;
        this.power = 5;
    }
}




const itemW = new Item('tileW');
const itemTile = new Item('tile');
const itemSW = new Item('tileSW');
const itemHP = new Item('tileHP');
let hero = new Person('tileP');
let arrEnemies = []
for (let i = 0; i < count_tileE; i++) {
    let enemy = new Person('tileE')
    arrEnemies.push(enemy)
}


function randomInteger(min, max) {
    let rand = min + Math.random() * (max - min);
    return Math.floor(rand);
}

/* ------------------     ЗАПОЛНЕНИЕ ПОЛЯ ------------------- */ 
function createTonnel() {
    const countHorizontalTonnel = randomInteger(3,6); 
    const countVerticalTonnel = randomInteger(3,6); 

    let tonnels_y = new Set();
    while (tonnels_y.size != countHorizontalTonnel) {
        let rand = randomInteger(0, field_height - 1);
        if (!tonnels_y.has(rand + 1) && !tonnels_y.has(rand - 1)) tonnels_y.add(rand);
    }
    for (let idx of tonnels_y) {
        for (let j = 0; j < field_weight; ++j) {
            const item = document.getElementById(`item-${idx}-${j}`);
            if (item.classList.contains('tileW')) item.classList.remove('tileW');
        }
    }
    
    let tonnels_x = new Set();
    while (tonnels_x.size != countVerticalTonnel) {
        let rand = randomInteger(0, field_weight - 1);
        if (!tonnels_x.has(rand + 1) && !tonnels_x.has(rand - 1)) tonnels_x.add(rand);
    }
    for (let idx of tonnels_x) {
        for (let j = 0; j < field_height; ++j) {
            const item = document.getElementById(`item-${j}-${idx}`);
            if (item.classList.contains('tileW')) item.classList.remove('tileW');
        }
    }
}

function createRoom() {
    const countRoom = randomInteger(5, 11); 

    for (let i = 0; i < countRoom; ++i) {
        const weight = randomInteger(3, 9);
        const height = randomInteger(3, 9); 

        const rand_y = randomInteger(0, field_weight - weight + 1);
        const rand_x = randomInteger(0, field_height - height + 1);

        for (let x = rand_x; x < rand_x + height; ++x) {
            for (let y = rand_y; y < rand_y + weight; ++y) {
                const item = document.getElementById(`item-${x}-${y}`);
                item.classList.remove('tileW');
            }
        }
    }
}

////// проверка на достижимость зон 

function traverseField(i, j, visited) { 
    if (!checkFeild(i, j)) {
        return;
    }

    if (visited[i + field_height * j]) {
        return;
    }

    let item = document.getElementById(`item-${i}-${j}`);
    if (item.classList.contains("tileW")) {
        return;
    }

    visited[i + field_height * j] = true;

    traverseField(i - 1, j, visited);
    traverseField(i + 1, j, visited);
    traverseField(i, j - 1, visited);
    traverseField(i, j + 1, visited);
}

function allReachable() {
    let visited = new Array(field_height*field_weight).fill(false);
    let components = 0;

    for (let i = 0; i < field_height; ++i) {
        for (let j = 0; j < field_weight; ++j) {
            
            let item = document.getElementById(`item-${i}-${j}`);

            if (item.classList.contains("tileW")) { continue; }       
            
            if (visited[i + field_height * j]) { continue; }
            if (components == 1) return false;

            traverseField(i, j, visited);
            components++;
        }
    }

    return true;
}

function createField() {
    do {
        field.innerHTML = '';
        fillWalls();
        createRoom();
        createTonnel();
    } while (!allReachable()) 

    restartPersons();

    putItem('tileP', 1);
    putItem('tileE', count_tileE);
    putItem('tileHP', count_tileHP);
    putItem('tileSW', count_tileSW);
    
    fillInnerState();
}

function fillWalls() {
    for (let i = 0; i < field_height; ++i) {
        for (let j = 0; j < field_weight; ++j) {
            let block = document.createElement("div");
            block.classList.add('tileW');
            block.classList.add('tile');
            block.setAttribute('id', `item-${i}-${j}`);
            field.append(block)
        }
    }
}

function fillStatistic() {
    let hero_health = document.createElement("p");
    hero_health.id = "health";
    hero_health.innerHTML = `${hero.getHealth()}`;
    statistic.querySelector(".health").append(hero_health);

    let hero_power = document.createElement("p");
    hero_power.id = "power";
    hero_power.innerHTML = `${hero.getPower()}`;
    statistic.querySelector(".power").append(hero_power);

    let alive_enemy = document.createElement("p");
    let count = 0;
    for (let item of personLocations) {
        if (item[0].getClass() == 'tileE') count++;
    }
    alive_enemy.innerHTML = `${count}`;
    alive_enemy.id = "alive_enemy";
    
    statistic.querySelector(".alive_enemy").append(alive_enemy);
}

function fillInnerState() {
    let count_enemies = 0;
    for (let i = 0; i < field_height; ++i) {
        for (let j = 0; j < field_weight; ++j) {
            let item = document.getElementById(`item-${i}-${j}`);
            if (item.classList.contains('tileP')) {
                fieldState[i + field_height * j] = hero;
                personLocations.set(hero, [i, j]);
            } else if (item.classList.contains('tileE')) {
                fieldState[i + field_height * j] = arrEnemies[count_enemies];
                personLocations.set(arrEnemies[count_enemies], [i, j]);
                count_enemies ++;
            } else if (item.classList.contains('tileHP')) {
                fieldState[i + field_height * j] = itemHP;
            } else if (item.classList.contains('tileSW')) {
                fieldState[i + field_height * j] = itemSW;
            } else if (item.classList.contains('tileW')) {
                fieldState[i + field_height * j] = itemW;
            } else {
                fieldState[i + field_height * j] = itemTile;
            }
        }
    }
}

function updateStatistic(name, value) {
    document.getElementById(`${name}`).innerHTML = `${value}`;
}

function restartPersons() {
    for (let enemy of arrEnemies) enemy.clear();
    hero.clear();
}

function restartGame() {
    createField();
    updateStatistic('health', hero.getHealth())
    updateStatistic('power', hero.getPower())
    updateStatistic('alive_enemy', arrEnemies.length)
    inventary.innerHTML = ''
}

/* ------------------    КОНЕЦ ЗАПОЛНЕНИЯ ПОЛЯ ------------------- */ 



/* ------------------    ПРОВЕРКИ ------------------------------- */ 

function checkHeroAlive(hero) {
    if (hero.isDead) {
        console.log("a")
        alert ("Вы проиграли. Попробуйте заново");
        restartGame()
    }
}

function checkFeild(i, j) {
    if (i  >= 0 && i < field_height && j >= 0 && j < field_weight) return true;
    else return false;
}

function canMove(i, j) {
    if (checkFeild(i, j)) {
        if (fieldState[i + field_height * j].getClass() != 'tileW' && fieldState[i + field_height * j].getClass() != 'tileE') return true
        else return false;
    }
}

function checkHeroItem(i, j) {
    let item = fieldState[i + field_height * j];
    if (item.getClass() == 'tileHP') {
        hero.setHealth(30);
        deleteItem(item, i, j);

        getItem('tileHP');
        updateStatistic('health', hero.getHealth());
    }
    if (item.getClass() == 'tileSW'){ 
        hero.setPower(30);
        deleteItem(item, i, j);

        getItem('tileSW');
        updateStatistic('power', hero.getPower());
    }
}

function checkAllEnemiesIsDead(arrEnemies) {
    let countDeadEnemies = 0;
        for (let enemy of arrEnemies) {
            if (!personLocations.has(enemy)) countDeadEnemies++;
        }
        updateStatistic('alive_enemy', arrEnemies.length - countDeadEnemies)
        if (countDeadEnemies == arrEnemies.length) return true;
        else return false;
}

/* ------------------    КОНЕЦ ПРОВЕРОК ------------------------------- */ 


/* ------------------    АКТИВНОСТЬ ------------------------------- */ 

function deleteItem(key, i = -1, j= -1) {
    if (personLocations.has(key)) {
        let [i, j] = personLocations.get(key);
        fieldState[i + field_height * j] = itemTile;
        personLocations.delete(key);

        let tmp = document.getElementById(`item-${i}-${j}`);
        tmp.innerHTML = '';
        tmp.classList.remove(key.getClass())

        if (checkAllEnemiesIsDead(arrEnemies)) {
            alert("ВЫ ВЫЙГРАЛИ");
            restartGame();
        }
    } else {
        document.getElementById(`item-${i}-${j}`).classList.remove(key.getClass())
        fieldState[i + field_height * j] = itemTile;
    }
}

function getItem(name) {
    let block = document.createElement("div");
    block.classList.add(name);
    block.classList.add('tile');
    inventary.append(block);
}

function movePerson(key, [i, j], [newi, newj]) {
    fieldState[newi + field_height * newj] = key;
    fieldState[i + field_height * j] = itemTile;

    document.getElementById(`item-${i}-${j}`).classList.remove(key.getClass());
    document.getElementById(`item-${i}-${j}`).innerHTML = '';
    document.getElementById(`item-${newi}-${newj}`).classList.add(key.getClass());
    let block = document.createElement("div");
    block.classList.add('health');
    document.getElementById(`item-${newi}-${newj}`).append(block)
    personLocations.set(key, [newi, newj]);
    updatePersonHealth(key);
}

function updatePersonHealth(key) {
    if (personLocations.has(key)) {
        const [i, j] = personLocations.get(key);
        document.getElementById(`item-${i}-${j}`).querySelector(`.health`).style.setProperty('width', `${key.getHealth()}%`);
    }
}

function enemyFight(idxs) {
    const move_choise = [[-1, 0], [0, -1], [1, 0], [0, 1]];
    for (let choise of move_choise){
        let tmp_i = idxs[0] + choise[0];
        let tmp_j = idxs[1] + choise[1];
        if (checkFeild(tmp_i, tmp_j)) {
            const fieldClass = fieldState[tmp_i + field_height * tmp_j].getClass();
            if (fieldClass == 'tileP') {
                return [tmp_i, tmp_j];
            }
        }
    }
    return [-1, -1];
}

function enemyMove(idxs) {
    const move_choise = [[-1, 0], [0, -1], [1, 0], [0, 1]];
    let available_choise = [];
    for (let choise of move_choise) {
        let tmp_i = idxs[0] + choise[0];
        let tmp_j = idxs[1] + choise[1];
        if (checkFeild(tmp_i, tmp_j)) {
            const fieldClass = fieldState[tmp_i + field_height * tmp_j].getClass();
            if (fieldClass != 'tileW' && fieldClass != 'tileP' && fieldClass != 'tileE' && fieldClass != 'tileHP' && fieldClass != 'tileSW') available_choise.push([tmp_i, tmp_j]);
        }
    }
    if (available_choise.length == 0) return [idxs[0], idxs[1]];
    else {
        let choise = randomInteger(0, 100) % available_choise.length;
        return available_choise[choise];
    }
}

function renderEnemy() {
    for (let [key, val] of personLocations) {
        if (key == hero) { continue; }
        if (key.checkDead()){
            deleteItem(key);
            continue;
        } 
        if (key.getClass() == "tileE") {
            let [tmp_i, tmp_j] = enemyFight(val);
            if (tmp_i != -1 && tmp_j != -1) {
                hero.setHealth(-key.getPower());
                checkHeroAlive(hero);
                updatePersonHealth(hero);
                updateStatistic('health', hero.getHealth());
            }

            let [newi, newj] = enemyMove(val);
            if ([newi, newj] != [val[0], val[1]]) {
                movePerson(key, [val[0], val[1]], [newi, newj]);
            }
            
        }
    }
}

function putItem(name, count) {
    do {
        const rand_y = randomInteger(0, field_weight - 1);
        const rand_x = randomInteger(0, field_height - 1);
        const item = document.getElementById(`item-${rand_x}-${rand_y}`);
        if (!item.classList.contains("tileW") && !item.classList.contains("tileP") 
            && !item.classList.contains("tileE") && !item.classList.contains("tileHP") 
            && !item.classList.contains("tileSW")){
            item.classList.add(name);
            if (name == 'tileP' || name == 'tileE'){
                let block = document.createElement("div");
                block.classList.add('health');
                item.append(block)
            }
            count -= 1;
        }
    } while (count != 0)
    
}




regenerateBtn.addEventListener('click', () => {
    restartGame();
    regenerateBtn.blur();
})

window.addEventListener('keydown', function(event) {
    let [i, j] = personLocations.get(hero);
    if (event.keyCode == 65 ) {
        let newj=j-1;     
        if (canMove(i, newj)) {
            checkHeroItem(i, newj);
            movePerson(hero, [i, j], [i, newj]);
        }
    } else if (event.keyCode == 68) {
        let newj=j+1;
        if (canMove(i, newj)) {
            checkHeroItem(i, newj);
            movePerson(hero, [i, j], [i, newj]);
        }
    } else if (event.keyCode == 87) {
        let newi=i-1;
        if (canMove(newi, j)) {
            checkHeroItem(newi, j);
            movePerson(hero, [i, j], [newi, j]);
        }
    } else if (event.keyCode == 83) {
        let newi=i+1;
        if (canMove(newi, j)) {
            checkHeroItem(newi, j);
            movePerson(hero, [i, j], [newi, j]);
        }
    } else if (event.keyCode == 32) {
        const move_choise = [[-1, 0], [0, -1], [1, 0], [0, 1]];
        for (let choise of move_choise) {
            let tmp_i = i + choise[0];
            let tmp_j = j + choise[1];
            if (checkFeild(tmp_i, tmp_j)) {
                const fieldClass = fieldState[tmp_i + field_height * tmp_j];
                if (fieldClass.getClass() == 'tileE') {
                    fieldClass.setHealth(-hero.getPower());
                    updatePersonHealth(fieldClass);
                }
            }
        }
    }
});


(function IterationFunction () {
    renderEnemy();
    setTimeout(IterationFunction, 300);
})();


