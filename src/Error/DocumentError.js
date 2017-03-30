const AbstractFenrirError = require('./AbstractFenrirError');

/**
 * This error occurs, when there was an error when handling documents
 * @author Wolfgang Felbermeier <wf@felbermeier.com>
 */
class DocumentError extends AbstractFenrirError {

	constructor(code = '1-001', message = 'General Document error', data = {document: {}}) {
		super(code, message, data);
	}

}

module.exports = DocumentError;