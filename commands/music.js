const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
	.setName("music")
	.setDescription("Play some music")
	.addSubcommand((subcommand) =>
		subcommand
			.setName("play")
			.setDescription("plays a song")
			.addStringOption((option) =>
				option
					.setName("song")
					.setDescription("the song url/name")
					.setRequired(true)
			)
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("seek")
			.setDescription("plays a song")
			.addStringOption((option) =>
				option
					.setName("time")
					.setDescription("time to seek to")
					.setRequired(true)
			)
	)
	.addSubcommand((subcommand) =>
		subcommand.setName("prev").setDescription("play previous song")
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("playnext")
			.setDescription("plays a song as next in queue")
			.addStringOption((option) =>
				option
					.setName("song")
					.setDescription("the song url/name")
					.setRequired(true)
			)
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("remove")
			.setDescription("removes a song from the queue")
			.addStringOption((option) =>
				option
					.setName("song")
					.setDescription("the song url/name")
					.setRequired(true)
					.setAutocomplete(true)
			)
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("autoplay")
			.setDescription("plays similar songs automatically")
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("loop")
			.setDescription("loop song or queue")
			.addStringOption((option) =>
				option
					.setName("type")
					.setDescription("the raid you are assembling")
					.setRequired(true)
					.addChoice("No loop", "0")
					.addChoice("Song", "1")
					.addChoice("Queue", "2")
			)
	)
	.addSubcommand((subcommand) =>
		subcommand
			.setName("queue")
			.setDescription("posts the queue of the player")
			.addIntegerOption((option) =>
				option
					.setName("page")
					.setDescription("page of the queue")
					.setRequired(false)
			)
	)
	.addSubcommand((subcommand) =>
		subcommand.setName("stop").setDescription("stops the player")
	)
	.addSubcommand((subcommand) =>
		subcommand.setName("skip").setDescription("skips currently playing song")
	)
	.addSubcommand((subcommand) =>
		subcommand.setName("pause").setDescription("pause the music")
	)
	.addSubcommand((subcommand) =>
		subcommand.setName("continue").setDescription("continue playing the music")
	);

async function execute(interaction) {}

module.exports = { data, execute };
