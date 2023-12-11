const mysql = require("mysql");
var dbConfig = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_TABLE,
};
/**
 *
 * @param {Function} fn
 * @param  {...any} args
 * @returns {Promise}
 */
function promisify(thisArg, fn, ...args) {
	return new Promise((res, rej) => {
		fn.call(thisArg, ...args, (err, data) => {
			console.log("promisify CB", err, data);
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
	 * @throws {"DBERROR"}
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

		// values.push(table);
		console.log("GENERIC select", conditions);
		const whereTemplate = conditions.reduce(
			(prev, next, i) =>
				`${prev} \`${next[0]}\`=?${
					i === conditions.length - 1 ? "" : ` ${next[2] ?? "AND"} `
				}`,
			""
		);

		values.push(...conditions.map((el) => el[1]));
		console.log(
			"GENERIC select ",
			`SELECT ${whatTemplate} FROM ${table} WHERE ${whereTemplate}`,
			values
		);
		const query = mysql.format(
			`SELECT ${whatTemplate} FROM ${table} WHERE ${whereTemplate}`,
			values
		);

		try {
			return this.#run(query);
		} catch (error) {
			throw error;
		}
	}
	/**
	 *
	 * @param {string} table
	 * @param {[string,string,"AND"|"OR"|undefined][]} conditions
	 * @throws {"DBERROR"}
	 */
	async genericDelete(table, conditions) {
		const values = [];
		// values.push(table);
		const whereTemplate = conditions.reduce(
			(prev, next, i) =>
				`${prev} \`${next[0]}\`=?${
					i === conditions.length - 1 ? "" : ` ${next[2] ?? "AND"} `
				}`,
			""
		);
		values.push(...conditions.map((el) => el[1]));
		const query = mysql.format(
			`DELETE FROM ${table} WHERE ${whereTemplate}`,
			values
		);
		try {
			return this.#run(query);
		} catch (error) {
			throw error;
		}
	}
	/**
	 *
	 * @param {string} table
	 * @param {string[]} columns
	 * @param {string[][]} rowValues
	 * @throws {"DBERROR"}
	 */
	async genericInsert(table, columns, rowValues) {
		const values = [];
		// values.push(table);

		const columnsTemplate = columns.map((el) => `\`${el}\``).join(", ");
		// values.push(...columns);

		const valuesTemplate = rowValues
			.map((row) => `(${row.map(() => "?").join(", ")})`)
			.join(", ");
		for (const row of rowValues) {
			values.push(...row);
		}

		const query = mysql.format(
			`INSERT INTO ${table} (${columnsTemplate}) VALUES ${valuesTemplate} RETURNING *`,
			values
		);

		try {
			return this.#run(query);
		} catch (error) {
			throw error;
		}
	}

	async #run(query) {
		const client = mysql.createConnection(dbConfig);
		try {
			const data = await promisify(client, client.connect)
				.then(() => promisify(client, client.beginTransaction))
				.then(() => promisify(client, client.query, query));
			await client.commit();
			return data;
		} catch (e) {
			await promisify(client, client.rollback);
			console.error(err);
			throw "DBERROR";
		} finally {
			client.end();
		}
	}
}

module.exports = new DBManager();
