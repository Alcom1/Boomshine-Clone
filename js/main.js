// main.js
// Dependencies: 
// Description: singleton object
// This object will be our main "controller" class and will contain references
// to most of the other objects in the game.

"use strict";

// if app exists use the existing copy
// else create a new object literal
var app = app || {};

/*
 .main is an object literal that is a property of the app global
 This object literal has its own properties and methods (functions)
 
 */
app.main =
{
	//  properties
    WIDTH : 640, 
    HEIGHT : 480,
	canvas : undefined,
    ctx: undefined,
   	lastTime: 0, // used by calculateDeltaTime() 
    debug: true,
	
	sound : undefined,
	
	gameState : undefined,
	roundScore : 0,
	totalScore : 0,
	
	GAME_STATE: Object.freeze
	({
		BEGIN : 0,
		DEFAULT : 1,
		EXPLODING : 2,
		ROUND_OVER : 3,
		REPEAT_LEVEL : 4,
		END : 5,
	}),
	
	CIRCLE: Object.freeze
	({
		NUM_CIRCLES_START : 0,
		NUM_CIRCLES_END : 20,
		START_RADIUS : 8,
		MAX_RADIUS : 80,
		MIN_RADIUS : 2,
		MAX_LIFETIME : 1.4,
		MAX_SPEED : 90,
		EXPLOSION_SPEED : 60,
		IMPLOSION_SPEED : 84,
	}),
	
	CIRCLE_STATE: Object.freeze	//Fake enumeration, actually an object literal
	({
		NORMAL : 0,
		EXPLODING : 1,
		MAX_SIZE : 2,
		IMPLODING : 3,
		DONE : 4
	}),
	
	circles : [],
	numCircles: this.NUM_CIRCLES_START,
	paused: false,
	animationID: 0,
	
    // methods
	init : function()
	{
		console.log("app.main.init() called");
		
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');
		
		//Audio
		this.bgAudio = document.querySelector("#bgAudio");
		this.bgAudio.volume = 0.25;
		this.effectAudio = document.querySelector("#effectAudio");
		this.effectAudio.volume = 0.3;
		
		//Circles!
		this.numCircles = this.CIRCLE.NUM_CIRCLES_START;
		this.circles = this.makeCircles(this.numCircles);
		console.log("this.circles = " + this.circles);
		
		//Hook up mouse events
		this.canvas.onmousedown = this.doMousedown.bind(this);
		
		//Initial Game State
		this.gameState = this.GAME_STATE.BEGIN;
		
		// load level
		this.reset();
		
		// start the game loop
		this.update();
	},
	
	update: function()
	{
		// 1) LOOP
		// schedule a call to update()
	 	this.animationID = requestAnimationFrame(this.update.bind(this));
		
	 	// 2) PAUSED?
	 	// if so, bail out of loop
	 	
	 	// 3) HOW MUCH TIME HAS GONE BY?
	 	var dt = this.calculateDeltaTime();
	 	 
	 	// 4) UPDATE
	 	// move circles
		this.moveCircles(dt);
		
		//Check for collisions
		this.checkForCollisions();
	 	
		// 5) DRAW	
		// i) draw background
		this.ctx.fillStyle = "black"; 
		this.ctx.fillRect(0,0,this.WIDTH,this.HEIGHT); 
	
		// ii) draw circles
		this.drawCircles(this.ctx);
	
		// iii) draw HUD
		this.ctx.globalAlpha = 1.0;
		this.drawHUD(this.ctx);
		
		// iv) draw Pause Screen
		if(this.paused)
		{
			this.drawPauseScreen(this.ctx);
			return;
		}
		
		// iv) draw debug info
		if (this.debug)
		{
			// draw dt in bottom right corner
			this.fillText(this.ctx, "dt: " + dt.toFixed(3), this.WIDTH - 150, this.HEIGHT - 10, "18pt courier", "white");
		}
		
		// 6) Check for cheats!
		if(this.gameState == this.GAME_STATE.BEGIN || this.gameState == this.GAME_STATE.ROUND_OVER)
		{
			if(myKeys.keydown[myKeys.KEYBOARD.KEY_UP] && myKeys.keydown[myKeys.KEYBOARD.KEY_SHIFT])
			{
				this.totalScore++;
				this.sound.playEffect();
			}
		}
	},
	
	pauseGame: function()
	{
		this.paused = true;
		
		//Stop audio
		this.sound.stopBGAudio();
		
		//Stop animation loop
		cancelAnimationFrame(this.animationID);
		
		//Call update() once so that our paused screen gets drawn.
		this.update();
	},
	
	resumeGame: function()
	{
		//Stop the animation loop in case it's running
		cancelAnimationFrame(this.animationID);
		this.paused = false;
		
		//Audio
		this.sound.playBGAudio();
		
		//Restart the loop
		this.update();
	},
	
	fillText: function(ctx, string, x, y, css, color)
	{
		ctx.save();
		// https://developer.mozilla.org/en-US/docs/Web/CSS/font
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
	},
	
	calculateDeltaTime: function()
	{
		// what's with (+ new Date) below?
		// + calls Date.valueOf(), which converts it from an object to a 	
		// primitive (number of milliseconds since January 1, 1970 local time)
		var now,fps;
		now = (+new Date); 
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now; 
		return 1/fps;
	},
	
	reset: function()
	{
		this.numCircles += 5;
		this.roundScore = 0;
		this.circles = this.makeCircles(this.numCircles);
	},
	
	doMousedown: function(e)
	{
		//Audio
		this.sound.playBGAudio();
		
		//This does nothing?
		if(this.paused)
		{
			this.paused = false;
			this.update();
			return;
		}
		
		//Player can only click on one circle. Return if exploding.
		if(this.gameState == this.GAME_STATE.EXPLODING)
			return;
		
		//Click to go to next round
		if(this.gameState == this.GAME_STATE.ROUND_OVER)
		{
			this.gameState = this.GAME_STATE.DEFAULT;
			this.reset();
			return;
		}
		
		var mouse = getMouse(e);
		this.checkCircleClicked(mouse);
	},
	
	checkCircleClicked: function(mouse)
	{
		//I don't know why we are looping backwards
		for(var i = this.circles.length - 1; i >= 0; i--)
		{
			var c = this.circles[i];
			if(pointInsideCircle(mouse.x, mouse.y, c))
			{
				c.xSpeed = c.ySpeed = 0;
				c.state = this.CIRCLE_STATE.EXPLODING;
				this.gameState = this.GAME_STATE.EXPLODING;
				this.roundScore++;
				this.sound.playEffect();
				break;
			}
		}
	},
	
	circleHitLeftRight: function (c)
	{
		if(c.x < c.radius || c.x > this.WIDTH - c.radius)
		{
			return true;
		}
	},
	
	circleHitTopBottom: function (c)
	{
		if(c.y < c.radius || c.y > this.HEIGHT - c.radius)
		{
			return true;
		}
	},
	
	makeCircles: function(num)
	{
		var circleDraw = function(ctx)
		{
			ctx.save();
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
			ctx.closePath();
			ctx.fillStyle = this.fillStyle;
			ctx.fill();
			ctx.restore();
		}
		
		var circleMove = function(dt)
		{
			this.x += this.xSpeed * this.speed * dt;
			this.y += this.ySpeed * this.speed * dt;
		}
		
		var array = [];
		for(var i = 0; i < num; i++)
		{
			var c = {};
			
			c.x = getRandom(this.CIRCLE.START_RADIUS * 2, this.WIDTH, this.CIRCLE.START_RADIUS * 2);
			c.y = getRandom(this.CIRCLE.START_RADIUS * 2, this.HEIGHT, this.CIRCLE.START_RADIUS * 2);
			
			c.radius = this.CIRCLE.START_RADIUS;
			
			var randomVector = getRandomUnitVector();
			c.xSpeed = randomVector.x;
			c.ySpeed = randomVector.y;
			
			c.speed = this.CIRCLE.MAX_SPEED;
			c.fillStyle = getRandomColor();
			c.state = this.CIRCLE_STATE.NORMAL;
			c.lifetime = 0;
			
			c.draw = circleDraw;
			c.move = circleMove;
			
			Object.seal(c);	//Prevents any more properties from being added.
			array.push(c);
		}
		return array;
	},
	
	drawCircles: function(ctx)
	{
		this.ctx.globalAlpha = 0.9;
		
		if(this.gameState == this.GAME_STATE.ROUND_OVER)
		{
			this.ctx.globalAlpha = 0.25;
		}
		
		for(var i = 0; i < this.circles.length; i++)
		{
			var c = this.circles[i];
			if(c.state === this.CIRCLE_STATE.DONE)
				continue;
			
			c.draw(ctx);
		}
	},
	
	moveCircles: function(dt)
	{
		for(var i = 0; i < this.circles.length; i++)
		{
			var c = this.circles[i];
			
			//Skip done circles.
			if(c.state === this.CIRCLE_STATE.DONE)
			{
				continue;
			}
			
			//Explode exploding circles
			if(c.state === this.CIRCLE_STATE.EXPLODING)
			{
				//Grow
				c.radius += this.CIRCLE.EXPLOSION_SPEED * dt;
				
				if(c.radius >= this.CIRCLE.MAX_RADIUS)
				{
					c.state = this.CIRCLE_STATE.MAX_SIZE;
					console.log("circle #" + i + " hit CIRCLE.MAX_RADIUS");
				}
			}
			
			//Circle at max size
			if(c.state === this.CIRCLE_STATE.MAX_SIZE)
			{
				//Exist at max size for a duration
				c.lifetime += dt;
				
				//If reached max lifetime, implode
				if(c.lifetime >= this.CIRCLE.MAX_LIFETIME)
				{
					c.state = this.CIRCLE_STATE.IMPLODING;
					console.log("circle #" + i + " hit CIRCLE.MAX_LIFETIME");
				}
				continue;
			}
			
			//Implode imploding circles
			if(c.state === this.CIRCLE_STATE.IMPLODING)
			{
				//Shrink
				c.radius -= this.CIRCLE.IMPLOSION_SPEED * dt;
				
				//If radius is less than the minimum radius, circle will disappear and be done.
				if(c.radius <= this.CIRCLE.MIN_RADIUS)
				{
					console.log("circle #" + i + " hit CIRCLE.NIM_RADIUS and is gone");
					c.state = this.CIRCLE_STATE.DONE;
					continue;
				}
			}
			
			//Move circles
			c.move(dt);
			
			//Did the circle enter the screen edge?
			if(this.circleHitLeftRight(c))
			{
				c.xSpeed *= -1;
				c.move(dt);
			}
			if(this.circleHitTopBottom(c))
			{
				c.ySpeed *= -1;
				c.move(dt);
			}
		}
	},
	
	checkForCollisions: function()
	{
		if(this.gameState == this.GAME_STATE.EXPLODING)
		{
			// check for collisions between circles
			for(var i=0;i<this.circles.length; i++)
			{
				var c1 = this.circles[i];
				
				// only check for collisions if c1 is exploding
				if (c1.state === this.CIRCLE_STATE.NORMAL) continue;   
				if (c1.state === this.CIRCLE_STATE.DONE) continue;
				
				for(var j=0;j<this.circles.length; j++)
				{
					var c2 = this.circles[j];
					
					// don't check for collisions if c2 is the same circle
					if (c1 === c2) continue; 
					
					// don't check for collisions if c2 is already exploding 
					if (c2.state != this.CIRCLE_STATE.NORMAL )
						continue;  
					
					// don't check for collisions if c2 is done
					if (c2.state === this.CIRCLE_STATE.DONE)
						continue;
				
					// Now you finally can check for a collision
					if(circlesIntersect(c1,c2))
					{
						c2.state = this.CIRCLE_STATE.EXPLODING;
						c2.xSpeed = c2.ySpeed = 0;
						this.roundScore ++;
						this.sound.playEffect();
					}
				}
			}
			
			// round over?
			var isOver = true;
			for(var i=0;i<this.circles.length; i++)
			{
				var c = this.circles[i];
				if(c.state != this.CIRCLE_STATE.NORMAL && c.state != this.CIRCLE_STATE.DONE)
				{
					isOver = false;
					break;
				}
			}
		
			if(isOver)
			{
				//Stop audio
				this.sound.stopBGAudio();
				
				this.gameState = this.GAME_STATE.ROUND_OVER;
				this.totalScore += this.roundScore;
			}	
		}
	},
	
	drawHUD: function(ctx)
	{
		ctx.save();	//Isolated drawing sequence
		// draw score
      	// fillText(string, x, y, css, color)
		this.fillText(this.ctx, "This Round: " + this.roundScore + " of " + this.numCircles, 20, 20, "14pt courier", "#ddd");
		this.fillText(this.ctx, "Total Score: " + this.totalScore, this.WIDTH - 200, 20, "14pt courier", "#ddd");

		// BEGIN SCREEN
		if(this.gameState == this.GAME_STATE.BEGIN)
		{
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(this.ctx, "To begin, click a circle", this.WIDTH/2, this.HEIGHT/2, "30pt courier", "white");
		}
	
		// ROUND OVER SCREEN
		if(this.gameState == this.GAME_STATE.ROUND_OVER)
		{
			ctx.save();
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(this.ctx, "Round Over", this.WIDTH/2, this.HEIGHT/2 - 40, "30pt courier", "red");
			this.fillText(this.ctx, "Click to continue", this.WIDTH/2, this.HEIGHT/2, "30pt courier", "red");
			this.fillText(this.ctx, "Next round there are " + (this.numCircles + 5) + " circles", this.WIDTH/2 , this.HEIGHT/2 + 35, "20pt courier", "#ddd");
		}
		
		ctx.restore();
	},
	
	drawPauseScreen: function(ctx)
	{
		ctx.save();
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		this.fillText(
			ctx, 
			"... PAUSED ...",
			this.WIDTH / 2,
			this.HEIGHT / 2, 
			"40pt courier",
			"white");
		ctx.restore()
	},
}; // end app.main