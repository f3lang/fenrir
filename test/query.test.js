/**
 * This test suite tests the functionality of the query class.
 * It performs tests on creating queries from definitions and
 * will run a few benchmarks
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */

const expect = require('chai').expect;
const Query = require('../src/Query/Query');

describe("Query logic", function() {

	describe("Query", function(){
		it("analyses query definitions and builds and executable query", function(){
			let query = new Query({
				'and': [
					{'eq': {'name': 'Meier'}},
					{'eq': {'surname': 'Max'}}
				]
			}, {});
		});
		it("executes a query with a single object", function(){
			let query = new Query({
				'and': [
					{'eq': {'name': 'Meier'}},
					{'eq': {'surname': 'Max'}}
				]
			}, {});
			expect(query.objectMatches({name: 'Meier', surname: 'Max'})).to.equal(true);
			expect(query.objectMatches({name: 'Mustermann', surname: 'Max'})).to.equal(false);
			console.time("bench 100.000");
			let i = 100000;
			while(i--) {
				query.objectMatches({name: 'Mustermann', surname: 'Max'});
			}
			console.timeEnd("bench 100.000");
		});
	})

});