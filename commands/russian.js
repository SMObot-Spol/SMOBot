const { SlashCommandBuilder } = require("@discordjs/builders");
const russianManager = require("../managers/russian");
const data = new SlashCommandBuilder()
	.setName("russian")
	.setDescription("TODO");

/**
 * @type {Map<string,import("discord.js").CommandInteraction>}
 */
const lastServerInteractions = new Map();

/**
 *
 * @param {import("discord.js").CommandInteraction} interaction
 */
async function execute(interaction) {
	const serverId = interaction.guildId;
	const userId = interaction.user.id;
	let res;
	try {
		res = await russianManager.pullTrigger(serverId, userId);
	} catch (error) {
		if (!error instanceof Error) {
			interaction.reply({ content: `Error: ${error}`, ephemeral: true });
			return;
		}
		switch (error.name) {
			case "DED_ERR": {
				interaction.reply({
					content: `Jsi ded, znovu můžeš hrát <t:${Math.round(
						error.message / 1000
					)}:R>`,
					ephemeral: true,
				});
				break;
			}
			default: {
				interaction.reply({
					content: `Error: ${error.message}`,
					ephemeral: true,
				});
			}
		}
		return;
	}
	if (lastServerInteractions.has(serverId)) {
		await lastServerInteractions.get(serverId).deleteReply();
	}
	lastServerInteractions.set(serverId, interaction);
	interaction.reply(res ? "BANG" : "CLICK");
}

module.exports = { data, execute };
