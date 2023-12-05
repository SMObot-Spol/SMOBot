const mysql = require("mysql");
var dbConfig = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_TABLE,
};
/**
 *
 * @param {*} fn
 * @param  {...any} args
 * @returns {Promise}
 */
function promisify(fn, ...args) {
	return new Promise((res, rej) => {
		console.log("calling");
		fn(...args, (err, ...data) => {
			console.log("calback", err, data);
			if (err) rej(err);
			res(data);
		});
	});
}
class DBManager {
	/**
	 *
	 * @param {string | string[]} what
	 * @param {string} table
	 * @param {[string,string,"AND"|"OR"|undefined][]} conditions
	 */
	async genericSelect(what, table, conditions) {
		const values = [];
		let whatTemplate = "?";

		if (Array.isArray(what)) {
			whatTemplate = what.map((_, i) => (i === what.length - 1 ? "?" : "?, "));
			values.push(...what);
		} else {
			values.push(what);
		}

		values.push(table);

		const whereTemplate = conditions.reduce(
			(prev, next, i) =>
				`${prev} ${next[0]}=?` + i === conditions.length - 1
					? ""
					: ` ${next[2] ?? "AND"} `,
			""
		);
		values.push(...conditions.map((el) => el[1]));

		const query = mysql.format(
			`SELECT ${whatTemplate} FROM ? WHERE ${whereTemplate}`,
			values
		);

		const client = mysql.createConnection(dbConfig);
		try {
			return await promisify(client.connect)
				.then(promisify(client.beginTransaction))
				.then(promisify(client.query, query));
		} catch (e) {
			await promisify(client.rollback);
			onsole.error(err);
			return "DBERROR";
		} finally {
			client.end();
		}
	}
	getChar() {}
}

module.exports = new DBManager();
