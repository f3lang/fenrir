/**
 * Tests the complete integration of all components
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */

const expect = require('chai').expect;
const Fenrir = require('../src/Fenrir');

describe("Fenrir", function () {

	describe("Database", function () {
		let fenrir = {};
		before(function () {
			fenrir = new Fenrir(__dirname + "/integration/");
		});
		it("creates a new collection on requesting a non-existing collection", function () {
			let myCollection = fenrir.getCollection('test1', {});
		});
		it("returns a requested collection", function () {
			let myCollection = fenrir.getCollection('test', {});
		});
		it("returns a list of existing collections", function(){
			console.log(fenrir.listCollections());
		});
		after(function () {
		});
	});

	describe("Collection", function(){
		let collection = {};
		let mockDocument = {
			name: "My test document",
		};
		before(function () {
			let fenrir = new Fenrir(__dirname + "/integration/");
			collection = fenrir.getCollection("collection-test", {});
		});
		it("inserts data into the collection", function(){
			collection.insertOne(mockDocument);
			console.log(mockDocument);
		});
		it("may be queried for documents", function(){
			console.log(collection.find({'eq': {'name': 'My test document'}}).data());
		});
	});
});