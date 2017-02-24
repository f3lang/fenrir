const path = require('path');
const os = require('os');
const fs = require('graceful-fs');
const mkdirp = require('mkdirp');
const xdgBasedir = require('xdg-basedir');
const writeFileAtomic = require('write-file-atomic');
const dotProp = require('dot-prop');
const uniqueString = require('unique-string');

const configDir = xdgBasedir.config || path.join(os.tmpdir(), uniqueString());
const permissionError = 'You don\'t have access to this file.';
const defaultPathMode = 0o0700;
const writeFileOptions = {mode: 0o0600};

/**
 * Blatantly copied from https://github.com/yeoman/configstore
 * Changed to use custom path names.
 * This offers a simple way to work with the database configuration.
 *
 * @copyright Sindre Sorhus <sindresorhus@gmail.com>
 */
class Configuration {
	constructor(defaults, path) {
		this.path = path.join(path, 'fenrir.json');
		this.all = Object.assign({}, defaults, this.all);
	}

	get all() {
		try {
			return JSON.parse(fs.readFileSync(this.path, 'utf8'));
		} catch (err) {
			// Create dir if it doesn't exist
			if (err.code === 'ENOENT') {
				mkdirp.sync(path.dirname(this.path), defaultPathMode);
				return {};
			}

			// Improve the message of permission errors
			if (err.code === 'EACCES') {
				err.message = `${err.message}\n${permissionError}\n`;
			}

			// Empty the file if it encounters invalid JSON
			if (err.name === 'SyntaxError') {
				writeFileAtomic.sync(this.path, '', writeFileOptions);
				return {};
			}

			throw err;
		}
	}

	set all(val) {
		try {
			// Make sure the folder exists as it could have been deleted in the meantime
			mkdirp.sync(path.dirname(this.path), defaultPathMode);

			writeFileAtomic.sync(this.path, JSON.stringify(val, null, '\t'), writeFileOptions);
		} catch (err) {
			// Improve the message of permission errors
			if (err.code === 'EACCES') {
				err.message = `${err.message}\n${permissionError}\n`;
			}

			throw err;
		}
	}

	get size() {
		return Object.keys(this.all || {}).length;
	}

	get(key) {
		return dotProp.get(this.all, key);
	}

	set(key, val) {
		const config = this.all;

		if (arguments.length === 1) {
			for (const k of Object.keys(key)) {
				dotProp.set(config, k, key[k]);
			}
		} else {
			dotProp.set(config, key, val);
		}

		this.all = config;
	}

	has(key) {
		return dotProp.has(this.all, key);
	}

	delete(key) {
		const config = this.all;
		dotProp.delete(config, key);
		this.all = config;
	}

	clear() {
		this.all = {};
	}
}

module.exports = Configuration;