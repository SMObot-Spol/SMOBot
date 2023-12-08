const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const russianManager = require("../managers/russian");
const data = new SlashCommandBuilder()
	.setName("russian")
	.setDescription("TODO")
	.addSubcommand((sub) =>
		sub.setName("play").setDescription("play russian roulette")
	)
	.addSubcommand((sub) =>
		sub.setName("killed").setDescription("see all ded players on this server")
	);
/**
 * @type {Map<string,import("discord.js").ChatInputCommandInteraction>}
 */
const lastServerInteractions = new Map();

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
function execute(interaction) {
	switch (interaction.options.getSubcommand()) {
		case "killed": {
			return getKills(interaction);
		}
		case "play": {
			return executeMe(interaction);
		}
		default: {
			interaction.reply({ ephemeral: true, content: "no touchy" });
		}
	}
}

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
async function getKills(interaction) {
	const serverId = interaction.guildId;
	let res;
	try {
		res = await russianManager.getKills(serverId);
	} catch (error) {
		console.error(error);
		interaction.reply({ content: `Error: ${error}`, ephemeral: true });
		return;
	}
	const e = new EmbedBuilder().addFields(
		...res.map((el, idx) => ({
			name: `#${idx + 1}`,
			value: `<@${el[0]}> (může hrát <t:${Math.round(el[1] / 1000)}:R>)`,
		}))
	);
	interaction.reply({
		embeds: [e],
	});
}

/**
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
async function executeMe(interaction) {
	const serverId = interaction.guildId;
	const userId = interaction.user.id;
	let res;
	try {
		res = await russianManager.pullTrigger(serverId, userId);
	} catch (error) {
		console.error(error);
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
		try {
			await lastServerInteractions.get(serverId).deleteReply();
		} catch (error) {
			console.error(error);
		}
	}
	try {
		lastServerInteractions.set(serverId, interaction);
	} catch (error) {
		console.error(error);
	}
	interaction.reply(res ? "BANG" : "CLICK");
}

module.exports = { data, execute };
