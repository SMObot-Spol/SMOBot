/**
 * @param {import("discord.js").SlashCommandStringOption | import("discord.js").SlashCommandUserOption} option
 * @param {string} name
 * @param {string} desc
 * @param {boolean} required
 */
function optionBase(option, name, desc, required = true) {
	return option.setName(name).setDescription(desc).setRequired(required);
}

module.exports = {
	optionBase,
};
