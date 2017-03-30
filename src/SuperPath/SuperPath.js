/**
 * The SuperPath is kind of like a specialized index for a group of objects.
 * It keeps track of the data location of object data inside a persistent Object list.
 * This offers you the function to receive only the data you actually need from a list of objects
 * without the need of reading the objects in whole.
 *
 * e.g. you have a list of persons with the structure
 * [
 * 	{
 * 		name: 'Max Mustermann',
 * 		gender: 'm',
 * 		valid: true,
 * 		etc...
 * 	},
 * 	{
 * 		name: 'Wolfgang Felbermeier',
 * 		gender: 'm',
 * 		valid: true,
 * 		etc...
 * 	},
 * 	etc...
 * ]
 * and you need to perform a query over the "name" field. Now the normal way would be to parse
 * all objects in the persistence file and search for the value. Works quite well for let's say
 * 100 objects or something in this order of size. But let's say you have a persistence file
 * with ~50.000 datasets. Then things get tricky. It would take ages to parse all data. So this is
 * what the SuperPath index is for. Before you read data from the file, you query the SuperPath and
 * get a list of file positions, where the id and the values of the objects are stored. So instead
 * of parsing 50.000 objects with millions of values in total, you only have to read and parse
 * 50.000 values from the persistence file. This speeds things up enormously.
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class SuperPath {

	constructor(persistenceAdapter, configuration) {

	}

	addObject(){

	}

	updateObject(){

	}

	removeObject(){

	}
}

module.exports = SuperPath;