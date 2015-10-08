var Dot = function(radius, ctx)
{
	this.radius = radius;
	this.pos = new Vect(
		radius + Math.random() * (canvas.width - radius * 2),
		radius + Math.random() * (canvas.height - radius * 2),
		0);
	this.vel = new Vect(
		Math.random() * Math.PI * 2,
		1.4,
		1);
	this.color = "hsla(" + (Math.random() * 255) + ", 50%, 50%, 0.6)"
	
	this.ctx = ctx;
}

Dot.prototype.draw = function()
{
	this.ctx.beginPath();
	this.ctx.arc(
		this.pos.xPos,
		this.pos.yPos,
		this.radius,
		0,
		2*Math.PI);
	this.ctx.fillStyle = this.color;
	this.ctx.fill();
}

Dot.prototype.offset = function()
{
	this.pos.add(this.vel);
}

Dot.prototype.logposX = function()
{
	console.log(this.pos.xPos);
}

Dot.prototype.logposY = function()
{
	console.log(this.pos.yPos);
}

//Contains the dot to within a boundary
Dot.prototype.contain = function()
{
	//If beyond X ceiling and xPos is positive, deflect velocity, return true
	if(this.pos.ceilX(canvas.width - this.radius))
	{
		this.vel.reflX();
		return true;
	}
	
	//If beyond Y ceiling and yPos is positive, deflect velocity, return true
	if(this.pos.ceilY(canvas.height - this.radius))
	{
		this.vel.reflY();
		return true;
	}
	
	//If below X floor and xPos is negative, deflect velocity, return true
	if(this.pos.florX(this.radius))
	{
		this.vel.reflX();
		return true;
	}
	
	//If below Y floor and yPos is negative, deflect velocity, return true
	if(this.pos.florY(this.radius))
	{
		this.vel.reflY();
		return true;
	}
	
	return false;
}