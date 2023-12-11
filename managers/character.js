const dbManager = require("./db");
const axios = require("axios");
class CharacterManager {
	allChars = [];
	/**
	 *
	 * @param {string} charName
	 * @param {string} uid
	 * @returns {Promise<boolean>}
	 * @throws {"DBERROR"}
	 */
	async findChar(id, char) {
		try {
			const x = await dbManager.genericSelect("*", "toons", [
				["character", char],
				["discordid", id],
			]);
			console.log("xres", x);

			return x.length !== 0;
		} catch (err) {
			console.log("Database FINDCHAR: " + err);
			throw err;
		}
	}
	/**
	 *
	 * @param {string} charName
	 */
	async getCharClass(charName) {
		let toonUrl = `https://twinstar-api.twinstar-wow.com/character/?name=${charName}&realm=Helios`;
		let charData;
		try {
			charData = await axios.get(toonUrl).then((res) => res.data);
		} catch (error) {
			throw error;
		}
		console.log(charData);
		try {
			const gear = charData.equipment.reduce((agg, curr) => {
				agg[curr.slot] = {
					id: curr.id,
					name: curr.name.replaceAll(`'`, "'"),
				};
				return agg;
			}, {});
			return {
				classID: charData.class,
				classSpec1: charData.talents.talentTree[0].name ?? undefined,
				classSpec2: charData.talents.talentTree[1].name ?? undefined,
				ilvl: Math.round(charData.averageItemLevel) ?? undefined,
				gear,
			};
		} catch (error) {
			throw "PARSE_ERROR";
		}
	}
	/**
	 *
	 * @param {string} charName
	 * @param {string} uid
	 * @throws {"DBERROR" | "CHAR_ALREADY_REGISTERED" |"API_ERROR" | "PARSE_ERROR"}
	 */
	async addCharacter(charName, uid) {
		const char = charName.toLowerCase();

		try {
			if (await this.findChar(uid, char)) {
				throw "CHAR_ALREADY_REGISTERED";
			}
		} catch (error) {
			throw error;
		}

		let charClass;
		try {
			charClass = await this.getCharClass(char);
		} catch (error) {
			throw error;
		}
		const { classID, classSpec1, classSpec2, gear } = charClass;

		var ilvl = charClass.ilvl;

		if (isNaN(ilvl)) {
			ilvl = 0;
		}

		var tank = false;
		var mdmg = false;
		var rdmg = false;
		var heal = false;

		var classSpecCombo1 = `${classID}-${classSpec1}`;
		var classSpecCombo2 = `${classID}-${classSpec2}`;

		const { heals, mdps, rdps, tanks } = require("../constants/classSpecs");

		if (tanks.includes(classSpecCombo1) || tanks.includes(classSpecCombo2)) {
			tank = true;
		}

		if (heals.includes(classSpecCombo1) || heals.includes(classSpecCombo2)) {
			heal = true;
		}

		if (mdps.includes(classSpecCombo1) || mdps.includes(classSpecCombo2)) {
			mdmg = true;
		}

		if (rdps.includes(classSpecCombo1) || rdps.includes(classSpecCombo2)) {
			rdmg = true;
		}

		// var addQuery = `INSERT INTO toons (discordid, \`character\`, tank, heal, mdps, rdps, classid, ilvl, gear) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, discordid, \`character\`, tank, heal, mdps, rdps, classid, ilvl, gear`;
		const gearData = JSON.stringify(gear);

		// const queryString = mysql.createQuery(addQuery, queryParams);

		try {
			const res = await dbManager.genericInsert(
				"toons",
				[
					"discordid",
					`character`,
					"tank",
					"heal",
					"mdps",
					"rdps",
					"classid",
					"ilvl",
					"gear",
				],
				[
					[
						uid,
						char.toLowerCase(),
						tank ? 1 : 0,
						heal ? 1 : 0,
						mdmg ? 1 : 0,
						rdmg ? 1 : 0,
						classID,
						ilvl,
						gearData,
					],
				]
			);
			this.allChars.push(res);
			return res;
		} catch (error) {
			throw error;
		}
	}
	/**
	 *
	 * @param {string} charName
	 * @param {string} uid
	 * @throws {"DBERROR" | "CHAR_NOT_REGISTERED"}
	 */
	async removeCharacter(charName, uid) {
		const char = charName.toLowerCase();

		try {
			if (!(await this.findChar(uid, char))) {
				throw "CHAR_NOT_REGISTERED";
			}
		} catch (error) {
			throw error;
		}

		try {
			await dbManager.genericDelete("toons", [
				["CHARACTER", charName],
				["DISCORDID", uid],
			]);
			this.allChars = this.allChars.filter(
				(zachar) => !(zachar.character == char && zachar.discordid == uid)
			);
		} catch (error) {
			throw error;
		}
	}
}

module.exports = new CharacterManager();
