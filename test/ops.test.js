const expect = require('chai').expect;
const Operators = require('../src/Operators');

describe("Query Operators", function () {

	describe("$eq - exactly equal", function () {
		it("compares correctly", function () {
			expect(Operators.$eq('test', 'test')).to.equal(true);
			expect(Operators.$eq('test', 'test1')).to.equal(false);
			expect(Operators.$aeq(undefined, null)).to.equal(true);
		});
		it("compares not loosely", function () {
			expect(Operators.$eq('123', 123)).to.equal(false);
		});
	});

	describe("$aeq - loosely equal", function () {
		it("compares correctly", function () {
			expect(Operators.$aeq('test', 'test')).to.equal(true);
			expect(Operators.$aeq('test', 'test1')).to.equal(false);
			expect(Operators.$aeq(undefined, null)).to.equal(true);
		});
		it("compares loosely", function () {
			expect(Operators.$aeq('123', 123)).to.equal(true);
		});
	});

	describe("$dteq - equal dates", function(){
		it("compares correctly", function(){
			let dt1 = new Date();
			let dt2 = new Date();
			dt2.setTime(dt1.getTime());
			let dt3 = new Date();
			dt3.setTime(dt1.getTime() - 10000);
			let dt4 = new Date();
			dt4.setTime(dt1.getTime() + 10000);
			expect(Operators.$dteq(dt1, dt2)).to.equal(true);
			expect(Operators.$dteq(dt1, dt3)).to.equal(false);
			expect(Operators.$dteq(dt1, dt4)).to.equal(false);
		});
	});

	describe('$ne - not equal', function(){
		it("compares correctly", function(){
			expect(Operators.$ne(15, 20)).to.equal(true);
			expect(Operators.$ne(15, 15.0)).to.equal(false);
			expect(Operators.$ne(0, "0")).to.equal(true);
			expect(Operators.$ne(NaN, NaN)).to.equal(false);
			expect(Operators.$ne("en", NaN)).to.equal(true);
			expect(Operators.$ne(0, NaN)).to.equal(true);
		});
	});

	describe('$gt - greater than', function(){
		it('compares numerical values correctly', function(){
			expect(Operators.$gt(20, 15)).to.equal(true);
			expect(Operators.$gt(20, 20)).to.equal(false);
			expect(Operators.$gt(15, 20)).to.equal(false);
		});
		it('compares string values correctly', function(){
			expect(Operators.$gt('abc', 'abc')).to.equal(false);
			expect(Operators.$gt('bcd', 'abc')).to.equal(true);
		});
	});
});