export let game = null;
export let ut = null;
export function setGame(g) { game = g; if(!ut) ut = new Util(); }
export class Point{
	constructor(x, y){
		this.x = x;
		this.y = y;
	}
}
export class Util{
	constructor(){	
	}

	getMousePos(canvas, evt) {
	    var rect = canvas.getBoundingClientRect();
	    var marginTop = canvas.style.marginTop;
	    var border = canvas.style.borderWidth;

	    var x = evt.clientX - rect.left;
	    var y = evt.clientY - rect.top - marginTop
    

	    return new Point(x, y);	    
	}

	random(min, max){  

	    return Math.floor(Math.random() * (max - min + 1)) + min;	
	}


	randomColor(){	
		var colors = ["#C0392B", "#E74C3C", "#9B59B6", "#8E44AD", "#2980B9",
		"#3498DB", "#17A589", "#138D75", "#229954", "#28B463", "#D4AC0D",
		 "#D68910", "#CA6F1E", "#BA4A00"];
		return colors[this.random(0, colors.length-1)]
	}

	
	randomName(){
		var names = ['steve', 'sara', 'roger', 'jane', 'joe', 'lucas', 'harry', 'peter',
		'david', 'claire', 'kara'];
		return names[this.random(0, names.length-1)]
	}


	getDistance(i, f){
		return Math.abs(Math.sqrt(
			Math.pow((f.x-i.x), 2) + Math.pow((f.y-i.y), 2)));
	}

	getAngle(p1, p2){		
		var d1 = this.getDistance(p1, new Point(0, game ? game.SCREEN_SIZE.y : 400));
		var d2 = this.getDistance(p2, new Point(0, game ? game.SCREEN_SIZE.y : 400));	
        return ((Math.atan2(p2.y - p1.y, p2.x - p1.x)));
    }

    cirCollission(x1, y1, r1, x2, y2, r2){
    	return (this.getDistance(new Point(x1, y1),
    	new Point(x2, y2)) < (r1+r2));
    }

    drawHexagon(ctx, size, x, y){

    	var angle = 60;

    	ctx.beginPath();
		ctx.moveTo(x + size * Math.cos(0), y + size * Math.sin(0));
		for (var i=0; i < 7; i++) {
			var p = x + size * Math.cos(i * 2 * Math.PI / 6);
			var q = y + size * Math.sin(i * 2 * Math.PI / 6);
			var point = new Point(p, q);
			point = this.rotate(point, new Point(x, y), angle);
		  	ctx.lineTo(point.x, point.y);
		}		
		ctx.fillStyle = "black";
		ctx.fill();

    	// size -= 1;
		ctx.beginPath();
		ctx.moveTo(x + size * Math.cos(0), y + size * Math.sin(0));
		for (var i=0; i < 7; i++) {
			var p = x + size * Math.cos(i * 2 * Math.PI / 6);
			var q = y + size * Math.sin(i * 2 * Math.PI / 6);
			var point = new Point(p, q);
			point = this.rotate(point, new Point(x, y), angle);
		  	ctx.lineTo(point.x, point.y);
		}				
		ctx.fillStyle = "#2C3E50";
		ctx.fill();		
    }

    rotate(p, c, angle){
    	var si = Math.sin(angle);
		var co = Math.cos(angle);

	    // translate point back to origin:
	    p.x -= c.x;
	    p.y -= c.y;

	    // rotate point
	    var xnew = p.x * co - p.y * si;
	    var ynew = p.x * si + p.y * co;

	    // translate point back:
	    p.x = xnew + c.x;
	    p.y = ynew + c.y;
	    return p;
    }


	color(hex, lum) {

		// validate hex string
		hex = String(hex).replace(/[^0-9a-f]/gi, '');
		if (hex.length < 6) {
			hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
		}
		lum = lum || 0;

		// convert to decimal and change luminosity
		var rgb = "#", c, i;
		for (i = 0; i < 3; i++) {
			c = parseInt(hex.substr(i*2,2), 16);
			c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
			rgb += ("00"+c).substr(c.length);
		}

		return rgb;
	}

}




export class Hexagon{
	constructor(ctx, x, y){
		this.x = x;
		this.y = y;		
		this.ctx = ctx;					
		this.size = 20;		
		this.fillStyle = "gray";
		this.strokeStyle = "black";
		this.lineWidth = 2;
		this.points = [];

		// var my_gradient=this.ctx.createLinearGradient(this.x-this.size, this.y-this.size, this.size, this.size);
		// my_gradient.addColorStop(0,"black"); 
		// my_gradient.addColorStop(1,"white");
		// this.fillStyle = my_gradient;
		

		this.initialPoint = new Point(x + this.size * Math.cos(0), y + this.size * Math.sin(0));
		for (var i=0; i < 7; i++) {	
			var p = x + this.size * Math.cos(i * 2 * Math.PI / 6);
			var q = y + this.size * Math.sin(i * 2 * Math.PI / 6);
			var point = new Point(p, q);				
			point = ut.rotate(point, new Point(x, y), 60);		  	
		  	this.points.push(point);
		}	
		
	}

	draw(){	

		this.ctx.strokeStyle = this.strokeStyle;
		this.ctx.fillStyle = this.fillStyle;

		// this.ctx.shadowBlur = 10;
		// this.ctx.shadowColor = "black";

		

		// fill
		this.ctx.beginPath();
		this.ctx.moveTo(this.initialPoint.x, this.initialPoint.y);
		for (var i=0; i < 7; i++) {			
		  	this.ctx.lineTo(this.points[i].x, this.points[i].y);
		}
		this.ctx.closePath();		
		this.ctx.fill();

		// stroke
		this.ctx.beginPath();
		this.ctx.moveTo(this.initialPoint.x, this.initialPoint.y);
		for (var i=0; i < 7; i++) {			
		  	this.ctx.lineTo(this.points[i].x, this.points[i].y);
		}	
		this.ctx.closePath();
		this.ctx.lineWidth = 3;	
		this.ctx.stroke();
									
	}
}
export class Food{
	constructor(ctx, x, y){		
		this.ctx = ctx;		
		this.pos = new Point(x, y);		
		this.sizeMin = 2;
		this.sizeMax = 6;
		this.mainColor = ut.randomColor();		
		this.supportColor = ut.color(this.mainColor, 0.5);

		this.size = ut.random(this.sizeMin, this.sizeMax);	
		
	}

	draw(player){	

			this.pos.x -= player.velocity.x;
			this.pos.y -= player.velocity.y;			

			this.ctx.globalAlpha = 0.5;
			this.ctx.fillStyle = this.mainColor;
			this.ctx.beginPath();
			this.ctx.arc(parseInt(this.pos.x), parseInt(this.pos.y), this.size, 0, 2*Math.PI);		
			this.ctx.fill();
			
			this.ctx.globalAlpha = 1;
			this.ctx.fillStyle = this.supportColor;
			this.ctx.beginPath();
			this.ctx.arc(parseInt(this.pos.x), parseInt(this.pos.y), this.size/2, 0, 2*Math.PI);		
			this.ctx.fill();
	
			// this.ctx.fillStyle = "whitesmoke";
			// this.ctx.font="10px Arial";
			// this.ctx.fillText(parseInt(this.pos.x) + "," + parseInt(this.pos.y) , this.pos.x, this.pos.y-10);

	}

	die(){
		this.state = 1;
		var index = game.foods.indexOf(this);
		game.foods.splice(index, 1);
	}

	
}
export class Snake{
	constructor(ctx, name, id){		
		this.ctx = ctx;		
		this.name = name;
		this.id = id;
		this.score = 0;
		this.force =  5;
		this.state = 0;
		this.headType = ut.random(0, 2);
	
		
		this.pos = new Point(game.SCREEN_SIZE.x/2, game.SCREEN_SIZE.y/2);	
		this.velocity = new Point(0, 0); //arbitary point		
		this.angle = ut.random(0, Math.PI);	

		this.length = 10;
		this.MAXSIZE = 12;	
		this.size = 7;			
		
		// color
		this.mainColor = ut.randomColor();
		this.midColor = ut.color(this.mainColor, 0.33);
		this.supportColor = ut.color(this.midColor, 0.33);

		this.arr = [];		
		this.arr.push(new Point(game.SCREEN_SIZE.x/2, game.SCREEN_SIZE.y/2));
		for(var i=1; i<this.length; i++){
			this.arr.push(new Point(this.arr[i-1].x, this.arr[i-1].y));
		}

	}

	drawHeadTwoEyeBranch(){

		var x = this.arr[0].x;
		var y = this.arr[0].y;
	
		var d = this.size*1.9;
		var p1 = new Point(x + d*Math.cos(this.angle), y+ d*Math.sin(this.angle));
		p1 = ut.rotate(p1, this.arr[0], Math.PI/6)	
		var p2 = ut.rotate(new Point(p1.x, p1.y), this.arr[0], -Math.PI/3);
		
		
		//eye1
		//muscle
		this.ctx.fillStyle = this.mainColor;
		this.ctx.beginPath();
		this.ctx.arc(p1.x, p1.y, this.size/2 + 2, 0, 2*Math.PI);		
		this.ctx.fill();

		//eye
		this.ctx.fillStyle = "whitesmoke";
		this.ctx.beginPath();
		this.ctx.arc(p1.x, p1.y, this.size/2, 0, 2*Math.PI);		
		this.ctx.fill();

		//retina
		this.ctx.fillStyle = "black";
		this.ctx.beginPath();
		this.ctx.arc(p1.x + Math.cos(this.angle), p1.y + Math.sin(this.angle), this.size/4, 0, 2*Math.PI);		
		this.ctx.fill();


		//eye2		
		//muscle
		this.ctx.fillStyle = this.mainColor;
		this.ctx.beginPath();
		this.ctx.arc(p2.x, p2.y, this.size/2 + 2, 0, 2*Math.PI);		
		this.ctx.fill();

		//eye
		this.ctx.fillStyle = "whitesmoke";
		this.ctx.beginPath();
		this.ctx.arc(p2.x, p2.y, this.size/2, 0, 2*Math.PI);		
		this.ctx.fill();

		//retina
		this.ctx.fillStyle = "black";
		this.ctx.beginPath();
		this.ctx.arc(p2.x + Math.cos(this.angle), p2.y + Math.sin(this.angle), this.size/4, 0, 2*Math.PI);		
		this.ctx.fill();

		//head
		var grd=this.ctx.createRadialGradient(x, y, 2, x+4, y+4, 10);
		grd.addColorStop(0, this.supportColor);		
		grd.addColorStop(1, this.midColor);	
		this.ctx.fillStyle = grd;
		this.ctx.beginPath();
		this.ctx.arc(x, y, this.size+1, 0, 2*Math.PI);		
		this.ctx.fill();		

		// name
		this.ctx.fillStyle = "whitesmoke";
		this.ctx.font="10px Arial";
		this.ctx.fillText(this.name, x-10, y-10);		

	}

	drawHeadTwoEye(){

		var x = this.arr[0].x;
		var y = this.arr[0].y;

		//head
		this.ctx.fillStyle = this.color;
		this.ctx.beginPath();
		this.ctx.arc(x, y, this.size+1, 0, 2*Math.PI);		
		this.ctx.fill();

		
		//eye 1
		var d = this.size/2;
		var p1 = new Point(x + d*Math.cos(this.angle), y+ d*Math.sin(this.angle));
		p1 = ut.rotate(p1, this.arr[0], -20);		
		//eye
		this.ctx.fillStyle = "whitesmoke";
		this.ctx.beginPath();
		this.ctx.arc(p1.x, p1.y, this.size/2, 0, 2*Math.PI);		
		this.ctx.fill();

		//retina
		this.ctx.fillStyle = "black";
		this.ctx.beginPath();
		this.ctx.arc(p1.x + Math.cos(this.angle), p1.y + Math.sin(this.angle), this.size/4, 0, 2*Math.PI);		
		this.ctx.fill();


		//eye2
		var p2 = ut.rotate(p1, this.arr[0], 40);		
		//eye
		this.ctx.fillStyle = "whitesmoke";
		this.ctx.beginPath();
		this.ctx.arc(p2.x, p2.y, this.size/2, 0, 2*Math.PI);		
		this.ctx.fill();

		//retina
		this.ctx.fillStyle = "black";
		this.ctx.beginPath();
		this.ctx.arc(p2.x + Math.cos(this.angle), p2.y + Math.sin(this.angle), this.size/4, 0, 2*Math.PI);		
		this.ctx.fill();

		//name
		this.ctx.fillStyle = "whitesmoke";
		this.ctx.font="10px Arial";
		this.ctx.fillText(this.name, x-5, y-10);		

	}

	drawHeadOneEye(){
		var x = this.arr[0].x;
		var y = this.arr[0].y;

		//head
		this.ctx.fillStyle = this.color;
		this.ctx.beginPath();
		this.ctx.arc(x, y, this.size+2, 0, 2*Math.PI);		
		this.ctx.fill();

		//face
		this.ctx.fillStyle = "whitesmoke";
		this.ctx.beginPath();
		this.ctx.arc(x, y, this.size, 0, 2*Math.PI);		
		this.ctx.fill();

		//eye
		var d = 2;
		this.ctx.fillStyle = "black";
		this.ctx.beginPath();
		this.ctx.arc(x + d*Math.cos(this.angle), y + d*Math.sin(this.angle), this.size/1.5, 0, 2*Math.PI);		
		this.ctx.fill();

		//retina
		var d = 3;
		this.ctx.fillStyle = "white";
		this.ctx.beginPath();
		this.ctx.arc(x + d*Math.cos(this.angle), y + d*Math.sin(this.angle), this.size/4, 0, 2*Math.PI);		
		this.ctx.fill();


		//name
		this.ctx.fillStyle = "whitesmoke";
		this.ctx.font="10px Arial";
		this.ctx.fillText(this.name, x-5, y-10);
	}

	drawBody(x, y, i){
		
		var grd=this.ctx.createRadialGradient(x, y, 2, x+4, y+4, 10);
		grd.addColorStop(0, this.supportColor);		
		grd.addColorStop(1, this.midColor);				
		
		var radius = this.size - (i*0.01);
		if(radius < 0) radius = 1;

		this.ctx.beginPath();	
		this.ctx.fillStyle = this.mainColor;
		this.ctx.arc(x, y, radius+1, 0, 2*Math.PI);
		this.ctx.fill();

		this.ctx.fillStyle = grd;
		this.ctx.beginPath();	
		this.ctx.arc(x, y, radius, 0, 2*Math.PI);
		this.ctx.fill();

	}

	move(){
		this.velocity.x = this.force*Math.cos(this.angle);
		this.velocity.y = this.force*Math.sin(this.angle);
		
		//magic
		var d = this.size/2;
		for(var i=this.length-1; i>=1; i--){				
			this.arr[i].x = this.arr[i-1].x - d*Math.cos(this.angle);
			this.arr[i].y = this.arr[i-1].y - d*Math.sin(this.angle);			
			this.drawBody(this.arr[i].x, this.arr[i].y, i);	
		}

		this.pos.x += this.velocity.x;
		this.pos.y += this.velocity.y;

		if(this.headType == 0) this.drawHeadOneEye();
		else if(this.headType == 1) this.drawHeadTwoEye();
		else if(this.headType == 2) this.drawHeadTwoEyeBranch();
				
		this.checkCollissionFood();
		this.checkCollissionSnake();
		this.checkBoundary();
	}

	checkBoundary(){

		// //left
		// if(this.arr[0].x < game.world.x){
		// 	this.pos.x = game.world.x + this.size*2;
		// 	this.velocity.x *= -1;
		// 	this.angle = Math.PI - this.angle;
		// } 

		// //right
		// else if(this.arr[0].x > game.world.x + game.WORLD_SIZE.x){
		// 	this.pos.x = game.world.x + game.WORLD_SIZE.x - this.size*2;
		// 	this.velocity.x *= -1;
		// 	this.angle = Math.PI- this.angle;			
		// }

		// //up
		// else if(this.arr[0].y < game.world.y){
		// 	this.pos.y = game.world.y + this.size*2;
		// 	this.velocity.y *= -1;
		// 	this.angle = Math.PI - this.angle;
		// } 

		// //down
		// else if(this.arr[0].y > game.world.y + game.WORLD_SIZE.y){
		// 	this.pos.y = game.world.y + game.WORLD_SIZE.y - this.size*2;
		// 	this.velocity.y *= -1;
		// 	this.angle = Math.PI - this.angle;
		// }


	}

	//check snake and food collission
	checkCollissionFood(){	
		var x = this.arr[0].x;
		var y = this.arr[0].y;
		for (var i = 0; i < game.foods.length; i++) {
			if(ut.cirCollission(x, y, this.size+3, game.foods[i].pos.x,
			game.foods[i].pos.y, game.foods[i].size)){
				game.foods[i].die();
				this.addScore();			 
				this.incSize();
			}			
		}
	}

	checkCollissionSnake(){
		var x = this.arr[0].x;
		var y = this.arr[0].y;
		for (var i = 0; i < game.snakes.length; i++) {
			var s =  game.snakes[i];
			if(s !== this){
				for (var j = 0; j < game.snakes[i].arr.length; j+=2) {
					if(ut.cirCollission(x, y, this.size, s.arr[j].x, s.arr[j].y, s.size)){
						this.die();
					}       
				}
			}			
		}
	}

	addScore(){
		this.length++;
		this.score++;
		this.arr.push(new Point(-100, -100));	
	}

	incSize(){
		if(this.length % 30 == 0) this.size++;	
		if(this.size > this.MAXSIZE) this.size = this.MAXSIZE;	
	}

	changeAngle(angle){
		this.angle = angle;
	}

	die(){
		this.state = 1;
		if (this === game.snakes[0] && game.onDeath) {
			game.onDeath();
		}
		for (var i = 0; i < this.arr.length; i+=3) {
			if (this.arr[i]) game.foods.push(new Food(game.ctxFood, this.arr[i].x, this.arr[i].y));
		}
		var index = game.snakes.indexOf(this);		
		if (index > -1) game.snakes.splice(index, 1);
	}

	
	

}
export class SnakeAi extends Snake{
	constructor(ctx, name, id){	

		super(ctx, name, id);

		this.force = 2;				
		this.pos = new Point(ut.random(-6000, 1800), ut.random(-300, 900));	
		// this.pos = new Point(ut.random(0, 800), ut.random(0, 400));			
		this.length = ut.random(10, 50);	
				
		this.arr = [];
		this.arr.push(this.pos);
		for(var i=1; i<this.length; i++) this.arr.push(new Point(this.arr[i-1].x, this.arr[i-1].y));


		this.initAiMovement();
	}

	initAiMovement(){
		var self = this;	
		var count = 0;
		var units = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
		var unit = 0.5;		
		this.timer = setInterval(function(){		

			if(count > 20){
				self.angle += 0;
				unit = units[ut.random(0, units.length-1)];
			} 
			else if(count > 10) self.angle += unit;
			else if(count > 0) self.angle -= unit;

			count++;
			count %= 30;	
		
		}, 100);
	}


	move(player){
		this.velocity.x = this.force*Math.cos(this.angle);
		this.velocity.y = this.force*Math.sin(this.angle);
		for(var i=this.length-1; i>=1; i--){
			this.arr[i].x = this.arr[i-1].x;
			this.arr[i].y = this.arr[i-1].y;			
			
			//relative motion with player
			this.arr[i].x -= player.velocity.x;
			this.arr[i].y -= player.velocity.y;

			this.drawBody(this.arr[i].x, this.arr[i].y, i);
		}

		//move head		
		this.arr[0].x += this.velocity.x;
		this.arr[0].y += this.velocity.y;

		this.pos.x += this.velocity.x;
		this.pos.y += this.velocity.y;

		//relative motion with player
		this.arr[0].x -= player.velocity.x;
		this.arr[0].y -= player.velocity.y;

		if(this.headType == 0) this.drawHeadOneEye();
		else if(this.headType == 1) this.drawHeadTwoEye();
		else if(this.headType == 2) this.drawHeadTwoEyeBranch();


		this.ctx.beginPath();
		this.ctx.globalAlpha = 0.5;
		this.ctx.fillStyle = "white";
		if(this.inDanger) this.ctx.fillStyle = "red";
 		this.ctx.arc(this.pos.x, this.pos.y, this.shield, 0, 2*Math.PI);		
		this.ctx.fill();
		this.ctx.globalAlpha = 1;

		
		super.checkCollissionFood();	
		this.checkCollissionSnake();
		this.checkBoundary();
	}

	checkBoundary(){

		//left
		if(this.arr[0].x < game.world.x) this.arr[0].x = game.world.x + game.WORLD_SIZE.x;

		//right
		else if(this.arr[0].x > game.world.x + game.WORLD_SIZE.x) this.arr[0].x = game.world.x;

		//up
		if(this.arr[0].y < game.world.y) this.arr[0].y = game.world.y + game.WORLD_SIZE.y;

		//down
		else if(this.arr[0].y > game.world.y + game.WORLD_SIZE.y) this.arr[0].y = game.world.y;

	}

	
	die(){
		this.state = 1;
		for (var i = 0; i < this.arr.length; i+=3)game.foods.push(new Food(game.ctxFood,
		this.arr[i].x, this.arr[i].y));

		var index = game.snakes.indexOf(this);		
		game.snakes.splice(i, 1);
	}

	checkCollissionSnake(){
		var x = this.arr[0].x;
		var y = this.arr[0].y;
		for (var i = 0; i < game.snakes.length; i++) {
			var s =  game.snakes[i];
			if(s !== this){
				for (var j = 0; j < s.arr.length; j++) {					
					//death
					if(ut.cirCollission(x, y, this.size, s.arr[j].x, s.arr[j].y, s.size)){
						this.die();
					}       
				}
			}			
		}
	}

	
}
export class Game{
	constructor(ctxSnake, ctxFood, ctxHex){		
		this.ctxSnake = ctxSnake;	
		this.ctxFood = ctxFood;
		this.ctxHex = ctxHex;
		this.WORLD_SIZE = new Point(4000, 2000);		
		this.SCREEN_SIZE = new Point(window.innerWidth, window.innerHeight);
		this.world = new Point(-1200, -600);						
		this.snakes = [];		
		this.foods = [];
		this.bricks = [];		
	}

	init(){					
		this.snakes[0] = new Snake(this.ctxSnake, "John", 0);		
		for(var i=0; i<30; i++) this.addSnake(ut.randomName(), 100);		
		this.generateFoods(1000);			
	}

	draw(){		

		//draw world
		this.drawWorld();

		//draw bricks
		// this.drawBricks();			

		// move yourself
		if(this.snakes[0].state === 0)
			this.snakes[0].move();

		//move other snakes
		for(var i=1; i<this.snakes.length; i++)
		if(this.snakes[i].state === 0) this.snakes[i].move(this.snakes[0]);		

		//draw food
		for(var i=0; i<this.foods.length; i++) this.foods[i].draw(this.snakes[0]);			
		
		//draw Score
		this.drawScore();

		//draw map
		this.drawMap();
	}

	drawWorld(){
				
		this.ctxHex.fillStyle = "white";
		this.ctxHex.fillRect(this.world.x - 2, this.world.y - 2, this.WORLD_SIZE.x+4, this.WORLD_SIZE.y+4);

		this.ctxHex.fillStyle = "#17202A";
		this.ctxHex.fillRect(this.world.x, this.world.y, this.WORLD_SIZE.x, this.WORLD_SIZE.y);

		this.world.x -= this.snakes[0].velocity.x;
		this.world.y -= this.snakes[0].velocity.y;
	}

	drawScore(){
		var start = new Point(20, 20);
		for (var i = 0; i < this.snakes.length; i++) {			
			this.ctxSnake.fillStyle = this.snakes[i].mainColor;
			this.ctxSnake.font="bold 10px Arial";
			this.ctxSnake.fillText(this.snakes[i].name + ":" + this.snakes[i].score,
			start.x-5, start.y +i*15);		
		}
	}

	drawMap(){

		this.ctxSnake.globalAlpha = 0.5;

		var mapSize = new Point(100, 50);
		var start = new Point(20, this.SCREEN_SIZE.y-mapSize.y-10);
		this.ctxSnake.fillStyle = "white";		
		this.ctxSnake.fillRect(start.x, start.y, mapSize.x,  mapSize.y);
		this.ctxSnake.fill();

		this.ctxSnake.globalAlpha = 1;
		

		//draw all player in map	
		for (var i = 0; i < this.snakes.length; i++) {
			var playerInMap = new Point(start.x + (mapSize.x/this.WORLD_SIZE.x) * this.snakes[i].pos.x,
			start.y + (mapSize.y/this.WORLD_SIZE.y) * this.snakes[i].pos.y);

			// console.log(playerInMap);
			this.ctxSnake.fillStyle = this.snakes[i].mainColor;
			this.ctxSnake.beginPath();
			this.ctxSnake.arc(start.x + playerInMap.x, playerInMap.y + 10, 2, 0, 2*Math.PI);
			this.ctxSnake.fill();
		}	

		
	}

	// drawBricks(){
	// 	var size = 50;		
	// 	for(var i=0; i<this.bricks.length; i++){			
	// 		 ut.drawHexagon(this.ctxHex, 22, this.bricks[i].x + size/2, this.bricks[i].y + size/2);	
	// 		this.bricks[i].x -= this.snakes[0].velocity.x;
	// 		this.bricks[i].y -= this.snakes[0].velocity.y;

	// 		// this.ctxHex.fillStyle = "#2C3E50";
	// 		// this.ctxHex.fillRect(this.bricks[i].x + 5, this.bricks[i].y + 5, 40, 40);

	// 		//left
	// 		if(this.bricks[i].x + size < 0)this.bricks[i].x = this.SCREEN_SIZE.x;
	// 		//right
	// 		else if(this.bricks[i].x > this.SCREEN_SIZE.x)this.bricks[i].x = -size;
	// 		//up
	// 		else if(this.bricks[i].y + size < 0)this.bricks[i].y = this.SCREEN_SIZE.y;
	// 		//down
	// 		else if(this.bricks[i].y > this.SCREEN_SIZE.y)this.bricks[i].y = -size;
	// 	}
	// }

	
	addSnake(name, id){

		this.snakes.push(new SnakeAi(this.ctxSnake, name, id))
	}

	generateFoods(n){
		for(var i=0; i<n; i++){			
			this.foods.push(new Food(this.ctxFood, ut.random(-1200 +  50, 2800 - 50),
			ut.random(-600 + 50, 1400 - 50)));
		}
	}

	// generateBricks(){
	// 	var size = 50;
	// 	var inRows = this.SCREEN_SIZE.x/size + 2;
	// 	var inCols = this.SCREEN_SIZE.y/size + 2;
	// 	var start = new Point(-size, -size);
	// 	for(var i=0; i<inRows; i++){
	// 		for(var j=0; j<inCols; j++){
	// 			var point = new Point(start.x + i*size, start.y + j*size);				
	// 			this.bricks.push(point);
	// 		}
	// 	}
	// }

}
