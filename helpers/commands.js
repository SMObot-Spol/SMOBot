/**
 * @param {import("@discordjs/builders").SlashCommandStringOption | import("@discordjs/builders").SlashCommandUserOption} option
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
