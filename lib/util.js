Function.prototype.before = function (action) {
	this.hook = {
		when: 'before',
		action: action
	};
	
	return this;
};

Function.prototype.after = function (action) {
	this.hook = {
		when: 'after',
		action: action
	};
	
	return this;
};

Function.prototype.around = function (action) {
	this.hook = {
		when: 'around',
		action: action
	};
	
	return this;
};