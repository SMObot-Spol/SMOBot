const { SlashCommandBuilder } = require("@discordjs/builders");
const {
	MessageSelectMenu,
	MessageActionRow,
	MessageButton,
} = require("discord.js");
const footer = require("../constants/smobotFooter");
const { raidManager } = require("../constants/managers");
const raidRoomManager = require("../managers/raidRoom");
const collectorManager = require("../managers/collector");
const { optionBase } = require("../helpers/commands");

const optionsNames = {
	raid: "raid",
	hc: "hc",
	roles: "roles",
	time: "time",
	day: "day",
	info: "info",
	size: "size",
	leader: "leader",
};

const raidChoices = {
	toes: {
		id: "TOES",
		name: "Terrace of Endless Spring",
		img: "7/7e/Terrace_of_Endless_Spring_loading_screen.jpg",
	},
	hof: {
		id: "HOF",
		name: "Heart of Fear",
		img: "0/0b/Heart_of_Fear_loading_screen.jpg",
	},
	msv: {
		id: "MSV",
		name: "Mogu'shan Vaults",
		img: "9/9a/Mogu%27shan_Vaults_loading_screen.jpg",
	},
};

const data = new SlashCommandBuilder()
	.setName("lfm")
	.setDescription("Creates a raid announce to be sent to subscribed guilds.")
	.addStringOption((o) =>
		optionBase(o, optionsNames.raid, "the raid you are assembling")
			.addChoice(raidChoices.toes.name, raidChoices.toes.id)
			.addChoice(raidChoices.hof.name, raidChoices.hof.id)
			.addChoice(raidChoices.msv.name, raidChoices.msv.id)
	)
	.addStringOption((o) =>
		optionBase(o, optionsNames.hc, "Number of heroic bosses")
	)
	.addStringOption((o) =>
		optionBase(o, optionsNames.roles, "What you are looking for")
	)
	.addStringOption((o) =>
		optionBase(o, optionsNames.time, "When is the raid happening")
	)
	.addStringOption((o) =>
		optionBase(o, optionsNames.day, "What day is the raid on", false)
	)
	.addStringOption((o) =>
		optionBase(o, optionsNames.info, "Loot info or other details", false)
	)
	.addStringOption((o) =>
		optionBase(o, optionsNames.size, "10/25 man", false)
			.addChoice("10", "10m")
			.addChoice("25", "25m")
	)
	.addUserOption((o) =>
		optionBase(
			o,
			optionsNames.leader,
			"The Raid Leader (if it's not you)",
			false
		)
	);

/**
 *
 * @param {import("discord.js").CommandInteraction} interaction
 */
async function execute(interaction) {
	//#region setup vars
	const options = interaction.options;
	const raidID = options.getString(optionsNames.raid).toLowerCase();
	const raidImage = `https://static.wikia.nocookie.net/wowpedia/images/${raidChoices[raidID].img}`;
	const raidSize = options.getString(optionsNames.size);
	const iUser = interaction.user;
	const raidLeader = (options.getUser(optionsNames.leader) ?? iUser).id;
	const guildmoji = interaction.client.guilds.cache.get(process.env.EMOJIID);
	const checkmoji = guildmoji.emojis.cache.find(
		(emoji) => emoji.name === "TIMEY"
	);
	const raidName = raidSize
		? `${raidChoices[raidID].name} ${raidSize}`
		: raidChoices[raidID].name;
	//#endregion
	const raidBedFields = [
		{
			name: "HC :",
			value: options.getString(optionsNames.hc),
			inline: true,
		},
		{
			name: "Looking for :",
			value: options.getString(optionsNames.roles),
			inline: true,
		},
	];

	raidRoomManager.sort();

	const guildMenu = new MessageActionRow().addComponents(
		new MessageSelectMenu()
			.setCustomId(`custom-${iUser.id}`)
			.setPlaceholder("Nothing selected")
			.setOptions(
				raidRoomManager.rooms.map((room) => ({
					label: `${raidRoom.guild.name}\n`,
					value: room.id,
					emoji: guildmoji.emojis.cache.find(
						(emoji) =>
							emoji.name ==
							room.guild.name
								.replace(/[^a-zA-Z ]/g, "")
								.toUpperCase()
								.split(" ")[0]
					),
				}))
			)
			.setMinValues(1)
			.setMaxValues(raidRoomManager.rooms.length)
	);

	const buttons = new MessageActionRow().addComponents(
		new MessageButton()
			.setCustomId("ALL")
			.setLabel("Send to all")
			.setStyle("PRIMARY"),
		new MessageButton()
			.setCustomId("DELETE")
			.setLabel("Delete")
			.setStyle("DANGER")
	);

	if (options.getString(optionsNames.day))
		raidBedFields.push({
			name: "Day : ",
			value: options.getString(optionsNames.day),
		});
	raidBedFields.push({
		name: "Time : ",
		value: options.getString(optionsNames.time),
	});
	if (options.getString(optionsNames.info))
		raidBedFields.push({
			name: "Additional Info: ",
			value: options.getString(optionsNames.info),
		});

	const raidBed = {
		title: raidName,
		description: `by **${interaction.client.users.cache.get(raidLeader).tag}**`,
		color: 7419530,
		timestamp: Date.now(),
		footer,
		image: {
			url: raidImage,
		},
		author: raidManager,
		fields: raidBedFields,
	};

	await interaction.reply({
		embeds: [raidBed],
		components: [guildMenu, buttons],
		ephemeral: true,
	});

	collectorManager.stopAndDelete(interaction.user);

	const collectorInter = collectorManager.create(
		interaction,
		(i) => i.user.id === interaction.user.id
	);

	collectorInter.on("end", () => {
		collectorManager.delete(interaction.user);
	});

	collectorInter.on("collect", async (i) => {
		collectorManager.stopAndDelete(interaction.user);

		const linkButton = new MessageActionRow().addComponents(
			new MessageButton()
				.setLabel("Direct Message")
				.setURL("discord://-/users/" + raidLeader)
				.setStyle("LINK")
		);

		const raid = {
			description: "BLA",
		};

		const notifyChannels = (filterFn) => {
			raidRoomManager.rooms.filter(filterFn).forEach((filteredChan) =>
				filteredChan.send({
					content: "@everyone",
					embeds: [raidBed],
					components: [linkButton],
				})
			);
		};

		switch (i.customId) {
			case "DELETE": {
				raid.description = `${checkmoji} DELETED ${checkmoji}`;
				break;
			}
			case "ALL": {
				raid.description = `${checkmoji} SENT TO ALL ${checkmoji}`;
				notifyChannels(() => true);
				break;
			}
			default: {
				raid.description = `${checkmoji} SENT TO SELECTED CHANNELS ${checkmoji}`;
				notifyChannels((channel) => i.values.includes(channel.id));
				break;
			}
		}

		await interaction
			.editReply({ embeds: [raid], components: [], ephemeral: true })
			.catch(console.error);
	});
}

module.exports = { data, execute };
