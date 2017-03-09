/**
 * The Questionable Object is the base class for an object, index, query object etc. which you can send a query to.
 * All Objects, that are visited during a query should be inherited from this class
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class QuestionableObject {

	constructor(){
		if (new.target === QuestionableObject) {
			throw new TypeError("Cannot use QuestionableObject directly, please use a derived class");
		}
	}

	/**
	 *
	 */
	query(params){
	}

}

module.exports = QuestionableObject;