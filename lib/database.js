'use strict';

const { MongoClient } = require('mongodb');
const arrify = require('arrify');

const STATE_CONNECTED = 0;
const STATE_CONNECTING = 1;
const STATE_DISCONNECTED = 2;

class Database {
	constructor(urls = ['localhost'], options = {}) {
		this.urls = arrify(urls).map(url => {
			if (!url.startsWith('mongodb://')) {
				return 'mongodb://' + url;
			}

			return url;
		});

		this.options = options;
		this.state = STATE_DISCONNECTED;
	}

	connect() {
		if (this._connection) {
			return Promise.resolve(this._connection);
		}

		this.state = STATE_CONNECTING;

		this._connectionPromise = MongoClient.connect(this.urls.join(','), this.options)
			.then(db => {
				this.state = STATE_CONNECTED;
				this._connection = db;

				return db;
			});

		return this._connectionPromise;
	}

	connection() {
		if (this.state === STATE_DISCONNECTED) {
			throw new Error('Database is disconnected.');
		}

		if (this.state === STATE_CONNECTED) {
			return Promise.resolve(this._connection);
		}

		if (this.state === STATE_CONNECTING) {
			return this._connectionPromise;
		}
	}

	disconnect() {
		return this.connection()
			.then(db => {
				db.close();
				this.state = STATE_DISCONNECTED;
			});
	}

	register(model) {
		model.database = this;
	}
}

module.exports = Database;
