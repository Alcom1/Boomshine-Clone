//Vector constructor
//Choice 0 takes x and y
//Choice 1 takes angle and magnitude
var Vect = function(a, b, choice)
{
	switch(choice)
	{
		case 0:
			this.xPos = a;
			this.yPos = b;
			break;
		case 1: 
			this.xPos = Math.sin(a) * b;
			this.yPos = Math.cos(a) * b;
			break;
	}
}

//Vector addition
Vect.prototype.add = function(vect)
{
	this.xPos += vect.xPos;
	this.yPos += vect.yPos;
}

//Vector subtraction
Vect.prototype.sub = function(vect)
{
	this.xPos -= vect.xPos;
	this.yPos -= vect.yPos;
}

//Vector multiplication
Vect.prototype.mult = function(value)
{
	this.xPos *= value;
	this.yPos *= value;
}

//Vector normalization
Vect.prototype.norm = function()
{
	var length = Math.sqrt(
		this.xPos * this.xPos + 
		this.yPos * this.yPos);
	this.xPos /= length;
	this.yPos /= length;
}

//Limits the x of a vector to under a value
Vect.prototype.ceilX = function(max)
{
	if(this.xPos > max)
	{
		this.xPos = max;
		return true;
	}
	return false;
}

//Limits the y of a vector to under a value
Vect.prototype.ceilY = function(max)
{
	if(this.yPos > max)
	{
		this.yPos = max;
		return true;
	}
	return false;
}

//Limits the x of a vector to over a value
Vect.prototype.florX = function(min)
{
	if(this.xPos < min)
	{
		this.xPos = min;
		return true;
	}
	return false;
}

//Limits the y of a vector to over a value
Vect.prototype.florY = function(min)
{
	if(this.yPos < min)
	{
		this.yPos = min;
		return true;
	}
	return false;
}

//Reflects the vector across a vertical plane
Vect.prototype.reflX = function()
{
	this.xPos = -this.xPos;
}

//Reflects the vector across a horizontal plane
Vect.prototype.reflY = function()
{
	this.yPos = -this.yPos;
}