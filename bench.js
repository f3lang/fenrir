const Query = require('./src/Query/Query');
const Collection = require('./src/Base/Collection');

let collection = new Collection({}, {data: {}, getIndices: () => []});
collection.getIndexManager().createIndex('name', 'BTree');
collection.getIndexManager().createIndex('surname', 'BTree');

let query = new Query({
	'and': [
		{'eq': {'name': 'Thomas'}},
		{'eq': {'surname': 'Buxhofer'}}
	]
}, collection);

let testData = [
	{name: 'Markus', surname: 'Nachbaur'},
	{name: 'Matthias', surname: 'Buxhofer'},
	{name: 'Michele', surname: 'Paonne'},
	{name: 'Thomas', surname: 'Buxhofer'},
	{name: 'Sandra', surname: 'Urach'},
	{name: 'Silvijo', surname: 'Leben'},
	{name: 'Stefan', surname: 'Hammerl'},
	{name: 'Thomas', surname: 'Dallapiccola'},
	{name: 'Torsten', surname: 'Passow'},
	{name: 'Andreas', surname: 'Stückler'}
];
let benchData = [];
let i = 1;
while(i--){
	let i2 = 10;
	while(i2-- ) {
		let doc = Object.assign({}, testData[i2]);
		collection.insertOne(doc);
	}
}
console.log("data count:", Object.values(collection.data()).length);
console.time('single query');
console.log(query.run(collection,collection.data()));
console.timeEnd('single query');

console.time('bench');
i = 1;
while(i--) {
	query.run(collection, collection.data());
}
console.timeEnd('bench');