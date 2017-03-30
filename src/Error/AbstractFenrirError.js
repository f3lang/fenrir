/**
 * An abstract error class for errors occurring in the fenrir database
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class AbstractFenrirError extends Error {

	constructor(code, message, data) {
		if (new.target === AbstractFenrirError) {
			throw new TypeError('Cannot use AbstractFenrirError directly. Use a derived error class.');
		}
		super(message);
		this.code = code;
		this.message = message;
		this.data = data;
	}

}

module.exports = AbstractFenrirError;