class ArrayProxy extends Array{

	constructor(){
		super();
		this.dataAvailable = [];
	}

	push(data){
		super.push(data);
		this.dataAvailable[super.length - 1] = true;
	}

	get(index){
		return  this.dataAvailable[index] ? super[index] : 'blubber';
	}

	static get [Symbol.species] () {
		return 'blubber3';
	}

}


let arr = [];
let obj = {};
let prox = new Proxy(obj, {
	get: (target, name, receiver) => {
		return target[name] ? target[name] : 'blubb';
	}
});
let easyProx = new Proxy(obj, {
	get: obj.get,
	set: (target, name, value) => {
		target[name] = value;
	}
});
let fastProx = new ArrayProxy();

console.log('prepare');
let i = 1000000;
while(i--) {
	arr.push('value' + i);
	fastProx.push('value' + i);
	obj[i] = 'value' + i;
}
console.log('prepared datasets width 100M values');

console.log('testing Array');
console.time('array');
i = 1000000;
let testValue = '';
while(i--) {
	testValue = arr[i];
	testValue = arr[i];
	testValue = arr[i];
	testValue = arr[i];
	testValue = arr[i];
	testValue = arr[i];
	testValue = arr[i];
	testValue = arr[i];
	testValue = arr[i];
	testValue = arr[i];
}
console.timeEnd('array');

console.time('object');
i = 1000000;
testValue = '';
while(i--) {
	testValue = obj[i];
	testValue = obj[i];
	testValue = obj[i];
	testValue = obj[i];
	testValue = obj[i];
	testValue = obj[i];
	testValue = obj[i];
	testValue = obj[i];
	testValue = obj[i];
	testValue = obj[i];
}
console.timeEnd('object');

console.time('proxy');
i = 1000000;
testValue = '';
while(i--) {
	testValue = prox[i];
	testValue = prox[i];
	testValue = prox[i];
	testValue = prox[i];
	testValue = prox[i];
	testValue = prox[i];
	testValue = prox[i];
	testValue = prox[i];
	testValue = prox[i];
	testValue = prox[i];
}
console.timeEnd('proxy');

console.time('easy proxy');
i = 1000000;
testValue = '';
while(i--) {
	testValue = easyProx[i];
	testValue = easyProx[i];
	testValue = easyProx[i];
	testValue = easyProx[i];
	testValue = easyProx[i];
	testValue = easyProx[i];
	testValue = easyProx[i];
	testValue = easyProx[i];
	testValue = easyProx[i];
	testValue = easyProx[i];
}
console.timeEnd('easy proxy');

console.time('fast proxy');
i = 1000000;
testValue = '';
while(i--) {
	testValue = fastProx.get(i);
	testValue = fastProx.get(i);
	testValue = fastProx.get(i);
	testValue = fastProx.get(i);
	testValue = fastProx.get(i);
	testValue = fastProx.get(i);
	testValue = fastProx.get(i);
	testValue = fastProx.get(i);
	testValue = fastProx.get(i);
	testValue = fastProx.get(i);
}
console.timeEnd('fast proxy');