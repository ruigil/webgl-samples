
/*
	author: @oceanos
*/

var Particle = function () {
	this.location = new THREE.Vector3(0,0,0);
	this.velocity = new THREE.Vector3(0,0,0);
	this.acceleration = new THREE.Vector3(0,0,0);
	this.color = new THREE.Color(0xff0000);
	this.maxspeed = 5;
	this.maxforce = 1;
	this.mass = 10;
}

Particle.prototype = {
	update: function() {
		this.velocity.add(this.acceleration);
		if (this.velocity.length() > this.maxspeed) {
			this.velocity.setLength(this.maxspeed);
		}
		this.location.add(this.velocity);
		this.acceleration.set(0,0,0);
	},
	seek: function(target) {
		var force = target.clone();
		force.sub(this.location);
		force.normalize();
		force.multiplyScalar(this.maxforce);
		force.divideScalar(this.mass);
		this.acceleration.add(force);
	}
}