window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame    ||
		window.oRequestAnimationFrame      ||
		window.msRequestAnimationFrame     ||
		function( callback ){
			return window.setTimeout(callback, 1000 / 60);
		};
})();

window.cancelRequestAnimFrame = ( function() {
	return window.cancelAnimationFrame          ||
		window.webkitCancelRequestAnimationFrame    ||
		window.mozCancelRequestAnimationFrame       ||
		window.oCancelRequestAnimationFrame     ||
		window.msCancelRequestAnimationFrame        ||
		clearTimeout
} )();


var canvas = document.getElementById("canvas"),
		ctx = canvas.getContext("2d"), // taust
		W = window.innerWidth, // akna laius
		H = window.innerHeight, // akna kõrgus
		particles = [],
		ball = {}, // kuul
		paddles = [2], // labidad
		mouse = {}, // hiire liikumine
		points = 0, // punktid
		fps = 60,
		particlesCount = 20, // sädemete arv
		flag = 0, // lipu muutuja
		particlePos = {},
		multipler = 1, // sädemete suuna muutmiseks
		startBtn = {}, // stardi nupp
		restartBtn = {}, // restart
		over = 0,
		init, // animatsioonide käivitamiseks
		paddleHit;

// hiire liigutused mängu plaadile
canvas.addEventListener("mousemove", trackPosition, true);
canvas.addEventListener("mousedown", btnClick, true);

// tekita kokkupuutel labadega heli
collision = document.getElementById("collide");

// Täisekraan vastavalt akna suurusele
canvas.width = W;
canvas.height = H;

// valge taust
function paintCanvas() {
	ctx.fillStyle = "gray";
	ctx.fillRect(0, 0, W, H);
}

// Funktsioon mille abil luuakse labad
function Paddle(pos) {
	this.h = 10;
	this.w = 100;

	// Labade asukoht
	this.x = W/2 - this.w/2;
	this.y = (pos == "top") ? 0 : H - this.h;

}
paddles.push(new Paddle("bottom"));
paddles.push(new Paddle("top"));

// Pall
ball = {
	x: 50,
	y: 50,
	r: 10,
	c: "black",
	vx: 4,
	vy: 8,
	draw: function() {
		ctx.beginPath();
		ctx.fillStyle = this.c;
		ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
		ctx.fill();
	}
};
// Start nupp
startBtn = {
	w: 150,
	h: 50,
	x: W/2 - 70,
	y: H/2 - 25,

	draw: function() {
		ctx.strokeStyle = "black";
		ctx.lineWidth = "2";
		ctx.strokeRect(this.x, this.y, this.w, this.h);

		ctx.font = "20px Arial, sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStlye = "black";
		ctx.fillText("Alusta mängu", W/2, H/2 );
	}
};

// Restart nupp
restartBtn = {
	w: 200,
	h: 50,
	x: W/2 - 90,
	y: H/2 - 50,

	draw: function() {
		ctx.strokeStyle = "black";
		ctx.lineWidth = "2";
		ctx.strokeRect(this.x, this.y, this.w, this.h);

		ctx.font = "20px Arial, sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStlye = "red";
		ctx.fillText("PROOVI UUESTI", W/2, H/2 - 25 );
	}
};

// Functioon sädemete jaoks
function createParticles(x, y, m) {
	this.x = x || 0;
	this.y = y || 0;

	this.radius = 1.2;

	this.vx = -1.5 + Math.random()*3;
	this.vy = m * Math.random()*1.5;
}

// kõik mänguplaadile
function draw() {
	paintCanvas();
	for(var i = 0; i < paddles.length; i++) {
		p = paddles[i];

		ctx.fillStyle = "black";
		ctx.fillRect(p.x, p.y, p.w, p.h);
	}

	ball.draw();
	update();
}
// Funktsioon, mis muudab palli kiiruse iga 5 punkti tagant kiiremaks
function increaseSpd() {
	if(points % 4 == 0) {
		if(Math.abs(ball.vx) < 15) {
			ball.vx += (ball.vx < 0) ? -1 : 1;
			ball.vy += (ball.vy < 0) ? -2 : 2;
		}
	}
}

// Jälgi hiirekursori liikumist
function trackPosition(e) {
	mouse.x = e.pageX;
	mouse.y = e.pageY;
}

// Function to update positions, score and everything.
// Basically, the main game logic is defined here
function update() {
	updateScore();
	// seo hiire liigutused labade liikumisega
	if(mouse.x && mouse.y) {
		for(var i = 1; i < paddles.length; i++) {
			p = paddles[i];
			p.x = mouse.x - p.w/2;
		}
	}

	// Palli liigutamiseks
	ball.x += ball.vx;
	ball.y += ball.vy;
	// Kokkupuutel labadega
	p1 = paddles[1];
	p2 = paddles[2];

	if(collides(ball, p1)) {
		collideAction(ball, p1);
	}
	else if(collides(ball, p2)) {
		collideAction(ball, p2);
	}

	else {
		// Jooksuta gameOver() funktsiooni kui pall lendab üles või alla serva pihta
		if(ball.y + ball.r > H) {
			ball.y = H - ball.r;
			gameOver();
		}

		else if(ball.y < 0) {
			ball.y = ball.r;
			gameOver();
		}

		// Muuda palli suunda, kui pall tabab külgmisi seinu
		if(ball.x + ball.r > W) {
			ball.vx = -ball.vx;
			ball.x = W - ball.r;
		}

		else if(ball.x -ball.r < 0) {
			ball.vx = -ball.vx;
			ball.x = ball.r;
		}
	}



	// lipp seatud siis näita sädemeid
	if(flag == 1) {
		for(var k = 0; k < particlesCount; k++) {
			particles.push(new createParticles(particlePos.x, particlePos.y, multiplier));
		}
	}

	// Lennuta sädemeid
	emitParticles();

	// reset lipule
	flag = 0;
}

//Funktsioon, mis kontrollib kokkupõrget
function collides(b, p) {
	if(b.x + ball.r >= p.x && b.x - ball.r <=p.x + p.w) {
		if(b.y >= (p.y - p.h) && p.y > 0){
			paddleHit = 1;
			return true;
		}

		else if(b.y <= p.h && p.y == 0) {
			paddleHit = 2;
			return true;
		}

		else return false;
	}
}

// collides == true
function collideAction(ball, p) {
	ball.vy = -ball.vy;

	if(paddleHit == 1) {
		ball.y = p.y - p.h;
		particlePos.y = ball.y + ball.r;
		multiplier = -1;
	}

	else if(paddleHit == 2) {
		ball.y = p.h + ball.r;
		particlePos.y = ball.y - ball.r;
		multiplier = 1;
	}
// Punktide kasvades kasvab ka kiirus
	points++;
	increaseSpd();

	if(collision) {
		if(points > 0)
			collision.pause();

		collision.currentTime = 0;
		collision.play();
	}

	particlePos.x = ball.x;
	flag = 1;
}

// Funktsioon, mis paneb sädemed lendama
function emitParticles() {
	for(var j = 0; j < particles.length; j++) {
		par = particles[j];

		ctx.beginPath();
		ctx.fillStyle = "yellow";
		if (par.radius > 0) {
			ctx.arc(par.x, par.y, par.radius, 0, Math.PI*2, false);
		}
		ctx.fill();

		par.x += par.vx;
		par.y += par.vy;

		// Sädemete kiireks kaotamiseks
		par.radius = Math.max(par.radius - 0.05, 0.0);

	}
}
// Funktsioon tulemuse jaoks
function updateScore() {
	ctx.fillStlye = "white";
	ctx.font = "16px Arial, sans-serif";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Teie punktid: " + points, 20, 20 );
}

// Functioon, mis ilmutab ennast kui mäng on läbi
function gameOver() {
	ctx.fillStlye = "white";
	ctx.font = "20px Arial, sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText("Mäng läbi, saite "+points+" punkti!", W/2, H/2 + 25 );

	// Peata animatsioonid
	cancelRequestAnimFrame(init);

	// Sea lipp
	over = 1;

	// restardi nupp
	restartBtn.draw();
}

// Functioon animatsiooni jooksutamiseks
function animloop() {
	init = requestAnimFrame(animloop);
	draw();
}

// Function käivituseks
function startScreen() {
	draw();
	startBtn.draw();
}

// On button click (Restart ja start)
function btnClick(e) {

	// muutujad, et salvestada hiire asukoht kui klõpsatakse hiirega
	var mx = e.pageX,
			my = e.pageY;

	// Start nupule vajutades...
	if(mx >= startBtn.x && mx <= startBtn.x + startBtn.w) {
		animloop();

		// start nupp kaob peale selle vajutamist
		startBtn = {};
	}

	// juhul kui peale mängu soovitakse uuesti mängida - restart
	if(over == 1) {
		if(mx >= restartBtn.x && mx <= restartBtn.x + restartBtn.w) {
			ball.x = 20;
			ball.y = 20;
			points = 0;
			ball.vx = 4;
			ball.vy = 8;
			animloop();

			over = 0;
		}
	}
}
startScreen();
