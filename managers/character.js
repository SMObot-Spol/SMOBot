class CharacterManager {
	/**
	 *
	 * @param {string} charName
	 * @param {string} uid
	 * @returns {Promise<boolean>}
	 */
	async findChar(id, char) {
		let query = `SELECT * FROM \`toons\` WHERE \`character\` = '${char}' AND \`discordid\` = '${id}'`;
		try {
			const x = await execute(query);
			if (x.length === 0) {
				return false;
			} else {
				return true;
			}
		} catch (err) {
			console.log("Database FINDCHAR" + err);
		}
	}
	/**
	 *
	 * @param {string} charName
	 * @param {string} uid
	 * @returns {Promise<import("discord.js").EmbedField>}
	 */
	async addCharacter(charName, uid) {
		const char = charName.toLowerCase();

		var charExist = await findChar(uid, char);

		if (charExist) {
			addBed.fields.push({
				name: `${crossmoji} ${char.toUpperCase()}\n`,
				value: "\n**Postava už**\n**je zaregistrovana**\n",
				inline: true,
			});
			return addBed;
		}

		var { classID, ilvl, classSpec1, classSpec2, gear } = await getCharClass(
			char
		);

		if (classID == -1) {
			addBed.fields.push({
				name: `${crossmoji} ${char.toUpperCase()}\n`,
				value: "\n**Postava**\n**neexistuje**\n",
				inline: true,
			});
			return addBed;
		}

		//TODO TOTO SA ASI DA NARAZ ???
		var ilvl = ilvl;

		if (isNaN(ilvl)) {
			ilvl = 0;
		}

		var tank = false;
		var mdmg = false;
		var rdmg = false;
		var heal = false;

		var classSpecCombo1 = `${classID}-${classSpec1}`;
		var classSpecCombo2 = `${classID}-${classSpec2}`;

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

		var addQuery = `INSERT INTO toons (discordid, \`character\`, tank, heal, mdps, rdps, classid, ilvl, gear) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, discordid, \`character\`, tank, heal, mdps, rdps, classid, ilvl, gear`;
		const gearData = JSON.stringify(gear);

		const queryParams = [
			uid,
			char.toLowerCase(),
			tank ? 1 : 0,
			heal ? 1 : 0,
			mdmg ? 1 : 0,
			rdmg ? 1 : 0,
			classID,
			ilvl,
			gearData,
		];

		const queryString = mysql.createQuery(addQuery, queryParams);

		let exe = await execute(queryString, true);

		if (exe) {
			exe.forEach((row) => {
				allChars.push(row);
			});
		}

		if (exe == "DBERROR") {
			addBed.fields.push({
				name: `${crossmoji} ${char.toUpperCase()}\n`,
				value: "\n**DATABASE**\n**ERROR**\n",
				inline: true,
			});
			return addBed;
		}
		addBed.fields.push({
			name: `${checkmoji} ${char.toUpperCase()} ${checkmoji}\n`,
			value: "\n**Postava bola**\n**pridaná**\n**do databáze**\n",
			inline: true,
		});
		return addBed;
	}
}

module.exports = new CharacterManager();
