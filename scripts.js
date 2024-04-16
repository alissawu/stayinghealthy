// preload images
const obstacleImage = new Image();
obstacleImage.src = 'images/minecraftobstacle.jpeg';
const sanitizerImage = new Image();
sanitizerImage.src = 'images/handsanitizer.png';
const maskImage = new Image();
maskImage.src = 'images/mask.png';

var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");
canvas.width = 1200;
canvas.height = 800;

var gravity = 0.5;
var canJump = true;
var score = 0;
var currentQuestionId = 1;
var lifesaver = false;
var jetpack = false;

// Player class
class Player {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.ySpeed = 0;
        this.xSpeed = 5;
    }

    show() {
        ctx.fillStyle = lifesaver ? "blue" : "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y += this.ySpeed;
        this.ySpeed += gravity;
        if (this.y + this.height > canvas.height - 100) { // Check ground collision
            this.y = canvas.height - 100 - this.height;
            this.ySpeed = 0;
            canJump = true;
        }
    }
}

var player = new Player(100, canvas.height - 150, 40, 60);

// GameElement class
class GameElement {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    show() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= player.xSpeed;
    }
}

// Obstacle class
class Obstacle extends GameElement {
    constructor(image, x, y, width, height) {
        super(image, x, y, width, height);
        this.active = true;
    }

    update() {
        super.update();
        if (this.active) {
            this.checkCollision();
        }
    }

    checkCollision() {
        if (this.x < player.x + player.width && this.x + this.width > player.x &&
            this.y < player.y + player.height && this.y + this.height > player.y) {
            if (!lifesaver) {
                isDead();
            } else {
                lifesaver = false; // disable lifesaver after surviving one hit
                this.active = false; // it's not active
            }
        }
    }
}



// Sanitizer class
class Sanitizer extends GameElement {
    constructor(image, x, y, width, height) {
        super(image, x, y, width, height);
        this.collected = false; // New property to control whether it's collected
    }

    update() {
        super.update();
        if (!this.collected) {
            this.checkCollision();
        }
    }

    checkCollision() {
        // collision detection logic
        if (this.x < player.x + player.width && this.x + this.width > player.x &&
            this.y < player.y + player.height && this.y + this.height > player.y) {
            lifesaver = true;
            this.collected = true;  // set the sanitizer as collected
        }
    }
}

// Mask class
class Mask extends GameElement {
    constructor(image, x, y, width, height) {
        super(image, x, y, width, height);
        this.collided = false; // flag to check if the collision has already been handled
    }

    update() {
        super.update();
        this.checkCollision();
    }

    checkCollision() {
        // colllision detection logic
        if (!this.collided && this.x < player.x + player.width && this.x + this.width > player.x &&
            this.y < player.y + player.height && this.y + this.height > player.y) {
            this.collided = true; // true on first collision
            fetchQuestion();
            setTimeout(() => this.collided = false, 3000); // reset collision after a delay to allow re-triggering
        }
    }
}


function fetchQuestion() {
    const apiUrl = `https://3k722ttd40.execute-api.us-west-1.amazonaws.com/prod/question?questionID=${currentQuestionId}`;
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            askQuestion(data.question, data.answer);
            currentQuestionId = (currentQuestionId % 29) + 1; // loop back to 1 after 29
        })
        .catch(error => {
            console.error('Error fetching question:', error);
        });
}

function askQuestion(question, correctAnswer) {
    const userAnswer = prompt(question);
    if (userAnswer && userAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
        console.log("Correct answer!");
        score += 10; // add the score
    } else {
        console.log("Wrong answer. The correct answer was: ", correctAnswer);
        setTimeout(() => location.reload(), 1000)
    }
    drawScore();
}

var obstacles = [];
var sanitizers = [];
var masks = [];

function populateGameElements() {
    setInterval(() => {
        // generate new elements at rand, off the right side
        obstacles.push(new Obstacle(obstacleImage, canvas.width + Math.random() * 700, canvas.height - 150, 50, 50));
        sanitizers.push(new Sanitizer(sanitizerImage, canvas.width + Math.random() * 1000, 550, 28, 42));
        masks.push(new Mask(maskImage, canvas.width + Math.random() * 1500, 470, 48, 27));
    }, 4000); // every 4000, can change
}

function drawGround() {
    ctx.fillStyle = "green";
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
}

function drawScore() {
    ctx.clearRect(0, 0, canvas.width, 50); // clear the score area
    ctx.font = "26px Arial";
    ctx.fillStyle = "#0081bf";
    ctx.fillText("Score: " + score, 20, 30);
}

function isDead() {
    console.log("Game Over! Score: " + score);
    setTimeout(() => location.reload(), 500); // restart the game after 2 seconds
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas
    drawGround(); 
    player.show();
    player.update();

    // display + update obstacles, sanitizers, masks
    obstacles.forEach((obstacle, index) => {
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1); // remove off-screen obstacles
        } else {
            obstacle.show();
            obstacle.update();
        }
    });

    sanitizers.forEach((sanitizer, index) => {
        if (sanitizer.x + sanitizer.width < 0) {
            sanitizers.splice(index, 1); // remove off-screen sanitizers
        } else {
            sanitizer.show();
            sanitizer.update();
        }
    });

    masks.forEach((mask, index) => {
        if (mask.x + mask.width < 0) {
            masks.splice(index, 1); // remove off-screen masks
        } else {
            mask.show();
            mask.update();
        }
    });

    drawScore(); // draw the score
    requestAnimationFrame(gameLoop); // loop
}

// keyboard controls
document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowUp' && canJump) {
        player.ySpeed = -15;
        canJump = false;
    }
});

populateGameElements(); // populate game elements
gameLoop(); // game loop
