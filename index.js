"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config({ path: "./.env" });
require("isomorphic-fetch");
var mysql = require("mysql");
const { Pool, Client: Dabz } = require("pg");
const axios = require("axios");
const util = require("util");
const ytdl = require("play-dl");
const ytsr = require("ytsr");
const Voice = require("@discordjs/voice");
const { GiphyFetch } = require("@giphy/js-fetch-api");

const gipi = new GiphyFetch(process.env.GIPI);
const {
    Client,
    Intents,
    Permissions,
    Message,
    MessageActionRow,
    MessageButton,
    MessageCollector,
    MessageSelectMenu,
    InteractionCollector,
    Interaction,
} = require("discord.js");
const { channel } = require("diagnostics_channel");
const bot = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_INTEGRATIONS,
    ],
});

let musicQueue = new Map();
var testerUsers = [];

class Queue {
    constructor(
        voiceChannel,
        textChannel,
        playingMsg,
        player,
        songs,
        played,
        playing,
        dctime,
        autoplay,
        loop
    ) {
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel;
        this.playingMsg = playingMsg;
        this.player = player;
        this.songs = songs;
        this.played = played;
        this.playing = playing;
        this.dctime = dctime;
        this.autoplay = autoplay;
        this.loop = loop;
    }
}

class Song {
    constructor(title, url) {
        this.title = title;
        this.url = url;
    }
}

let tanks = [
    "1-Protection",
    "6-Blood",
    "2-Protection",
    "11-Feral Combat",
    "10-Brewmaster",
];
let rdps = [
    "3-Survival",
    "3-Markmanship",
    "3-Beast mastery",
    "5-Shadow",
    "7-Elemental",
    "8-Frost",
    "8-Fire",
    "8-Arcane",
    "9-Demonology",
    "9-Destruction",
    "9-Affliction",
    "11-Balance",
];
let mdps = [
    "1-Arms",
    "1-Fury",
    "2-Retribution",
    "4-Assassination",
    "4-Combat",
    "4-Subtlety",
    "6-Unholy",
    "6-Frost",
    "7-Enhancement",
    "10-Windwalker",
    "11-Feral Combat",
];
let heals = [
    "2-Holy",
    "5-Discipline",
    "5-Holy",
    "7-Restoration",
    "10-Mistweaver",
    "11-Restoration",
];

let classes = [
    ["Warrior", "<:warrior:938287643437977660>"],
    ["Paladin", "<:paladin:938287643379253318>"],
    ["Hunter", "<:hunter:938287643203092481>"],
    ["Rogue", "<:rogue:938287643303743498>"],
    ["Priest", "<:priest:938287643622518784>"],
    ["DeathKnight", "<:dk:938287643303759883>"],
    ["Shaman", "<:shaman:938287642980806668>"],
    ["Mage", "<:mages:938287643265990748>"],
    ["Warlock", "<:warlock:938287643324743752>"],
    ["Monk", "<:Monk:1177365333611397180>"],
    ["Druid", "<:druid:938287643110809601>"],
];

class Toonie {
    constructor(userId, name, charClass, charRole) {
        this.userId = userId;
        this.name = name;
        this.class = charClass;
        this.role = charRole;
    }
}

const musicBed = { description: ``, color: `0xff0000` };

const queueBed = {
    title: "",
    color: 0xebb102,
    timestamp: Date.now(),
    footer: {
        icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
        text: "powered by SMObot",
    },
    author: {
        name: "MUSIC Manager",
        icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
    },
    fields: [],
};

async function prev(gqueue, cguild, cchan) {
    await gqueue.songs.unshift(gqueue.played.pop());
    await play(gqueue.songs[0]?.url, cguild, cchan);
    updatePlaying(gqueue, cguild);
    return;
}

var dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_TABLE,
};

async function stop(gqueue, cguild) {
    try {
        gqueue.playing = false;
        await gqueue.player?.stop();
        gqueue.player = "";
        gqueue.songs = [];
        gqueue.autoplay = false;
        gqueue.played = [];
        const connection = Voice.getVoiceConnection(cguild);
        await connection?.destroy();
    } catch (error) {
        console.log(error);
    }
    updatePlaying(gqueue, cguild);
}

async function autoplay(gqueue, cguild) {
    gqueue.autoplay = !gqueue.autoplay;
    gqueue.loop = false;
    updatePlaying(gqueue, cguild);
    return;
}

async function skip(gqueue, cguild, cchan) {
    await gqueue.played.push(gqueue.songs.shift());
    await play(gqueue.songs[0]?.url, cguild, cchan);
    return;
}

async function pause(gqueue, cguild) {
    gqueue.playing = false;
    await gqueue.player.pause();
    updatePlaying(gqueue, cguild);
    return;
}

async function proceed(gqueue, cguild) {
    gqueue.playing = true;
    await gqueue.player.unpause();
    updatePlaying(gqueue, cguild);
    return;
}

async function updatePlaying(gqueue, cguild) {
    console.log("TUSOMMM");
    if (!gqueue.textChannel && gqueue.voiceChannel) {
        let guild = bot.guilds.cache.get(cguild);
        let voice = guild.channels.cache.get(gqueue.voiceChannel);
        gqueue.textChannel = guild.channels.cache.find(
            (channel) =>
                channel.name.toLowerCase() ==
                    voice.name.toLowerCase().replace(/\s+/g, "-") &&
                channel.parentId == voice.parentId &&
                channel.type == "GUILD_TEXT"
        );
    }

    queueBed.fields = [];

    //MEMTEST
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${used} MB`);
    //queueBed.title = `${used} MB`;

    queueBed.title = "Songs:";

    if (gqueue.playing == false) {
        var playing = ":pause_button:";
    } else {
        var playing = ":arrow_forward:";
    }

    if (gqueue.played.length > 0) {
        let previous = {
            name: ":track_previous:",
            value: `${gqueue.played[gqueue.played.length - 1].title}`,
        };
        queueBed.fields.push(previous);
    }

    if (gqueue.songs.length > 0) {
        let pl = {
            name: playing,
            value: `${gqueue.songs[0].title}`,
        };
        queueBed.fields.push(pl);
    }
    if (gqueue.songs.length > 1) {
        let upNext = {
            name: ":track_next:",
            value: `${gqueue.songs[1].title}`,
        };

        queueBed.fields.push(upNext);
    }

    if (gqueue.songs.length == 0 && gqueue.autoplay == false) {
        console.log("HERE");
        let announce = [
            {
                name: "No songs in the queue.",
                value: "Player stopped.",
            },
        ];
        queueBed.fields = announce;
        gqueue.playing = false;
    }

    const musicButtons = new MessageActionRow();

    if (gqueue.playing == false) {
        musicButtons.addComponents(
            new MessageButton()
                .setCustomId("sbmusicplay")
                .setEmoji("<:play:983780501275951125>")
                .setStyle("SUCCESS")
                .setDisabled(gqueue.songs.length == 0)
        );
    } else {
        musicButtons.addComponents(
            new MessageButton()
                .setCustomId("sbmusicpause")
                .setEmoji("<:pause:983780518942359662>")
                .setStyle("DANGER")
                .setDisabled(gqueue.songs.length == 0)
        );
    }

    musicButtons.addComponents(
        new MessageButton()
            .setCustomId("sbmusicstop")
            .setEmoji("<:stop:983784017855938631>")
            .setStyle("DANGER")
    );

    if (gqueue.autoplay == false) {
        musicButtons.addComponents(
            new MessageButton()
                .setCustomId("sbmusicautoplay")
                .setEmoji("<:autoplay:983853105617715211>")
                .setStyle("SECONDARY")
                .setDisabled(
                    gqueue.songs.length == 0 && gqueue.played.length == 0
                )
        );
    } else {
        musicButtons.addComponents(
            new MessageButton()
                .setCustomId("sbmusicautoplay")
                .setEmoji("<:autoplay:983853105617715211>")
                .setStyle("DANGER")
        );
    }

    const musicButtons2 = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("sbmusicprev")
            .setEmoji("<:previoustrack:983780558196858931>")
            .setStyle("SECONDARY")
            .setDisabled(gqueue.played.length < 1),
        new MessageButton()
            .setCustomId("sbmusicnext")
            .setEmoji("<:nexttrack:983780548096950322>")
            .setStyle("SECONDARY")
            .setDisabled(gqueue.songs.length < 2 && !gqueue.autoplay)
    );

    try {
        gqueue.playingMessage?.delete().catch(console.error);
    } catch {
        console.log("No playing message.");
        gqueue.playingMessage = "";
    }

    const connection = Voice.getVoiceConnection(cguild);

    if (!connection || !gqueue.player) {
        var buttComponents = [];
    } else {
        var buttComponents = [musicButtons, musicButtons2];
    }

    try {
        gqueue.playingMessage = await gqueue.textChannel?.send({
            embeds: [queueBed],
            components: buttComponents,
        });
    } catch (error) {
        console.log(error);
        console.log("Didnt find text channel.");
    }
    return;
}

async function gifSearch(term) {
    Math.random();
    let randomOffset = Math.floor(Math.random() * 200);
    const { data: gifs } = await gipi.search(term, {
        type: "gifs",
        limit: 25,
        offset: randomOffset,
    });
    let responseIndex = Math.floor(Math.random() * 10 + 1) % gifs.length;
    let gif = gifs[responseIndex];
    return gif;
}

async function unholyPlay(sg) {
    let song = sg;
    let cchan = "";
    let cguild = "";

    bot.guilds.cache.forEach((guild) => {
        guild.members.cache.forEach((member) => {
            if (member.id == "319128664291672085") {
                if (member.voice.channelId) {
                    cchan = member.voice.channelId;
                    cguild = guild.id;
                }
            }
        });
    });

    let gqueue = musicQueue.get(cguild);

    if (!cchan) {
        return;
    }

    if (gqueue.voiceChannel && cchan != gqueue.voiceChannel) {
        return;
    }

    const filters1 = await ytsr.getFilters(song);
    const filter1 = filters1.get("Type").get("Video");
    const options = {
        limit: 1,
        gl: `SK`,
        hl: `sk`,
    };
    let search = await ytsr(filter1.url, options);
    let searchUrls = search.items;

    if (gqueue.songs.length == 0) {
        gqueue.songs.push(searchUrls[0].url);
        await play(gqueue.songs[0]?.url, cguild, cchan);
    } else {
        gqueue.songs.push(searchUrls[0].url);
    }
    return;
}

let crossmoji;
let checkmoji;
let raidRoomId = [];
let lfmModules = [];
let testBed = { fields: [] };
let testguild;

console.log("Bot Fired Up!");
console.log(process.env.DTOKEN);
let rous;
var cron = require("node-cron");
const utils = require("pg/lib/utils");
const { clearTimeout } = require("timers");
const { log } = require("console");
var task = cron.schedule(
    "0 0 1 1 *",
    () => {
        var channelt = bot.channels.cache.get("694167912365424682");
        channelt
            .send("🎆 🍾  SMOBOT VÁM PRAJE ŠŤASTNÝ NOVÝ ROK  🍾 🎆")
            .catch(console.error);
    },
    {
        scheduled: true,
        timezone: "Europe/Bratislava",
    }
);

const client = mysql.createConnection(dbConfig);

var allChars = [];
var allRaids = [];

async function play(text, guildid, cchan, seek) {
    let queue = await musicQueue.get(guildid);

    if (queue.player == "") {
        queue.player = new Voice.AudioPlayer();
        queue.player.on(Voice.AudioPlayerStatus.Idle, async () => {
            if (queue.songs.length > 0) {
                await queue.played.push(queue.songs.shift());
            }
            if (queue.autoplay && queue.songs.length == 0) {
                let songs = await ytdl.video_info(
                    queue.played[queue.played.length - 1].url
                );
                songs.related_videos.splice(1, 2);
                let autoPlaySong = await ytdl.video_info(
                    songs.related_videos[Math.floor(Math.random() * 6)]
                );
                let songObject = new Song(
                    autoPlaySong.video_details.title,
                    autoPlaySong.video_details.url
                );
                await queue.songs.push(songObject);
            }
            playSingle(queue.songs[0]?.url, guildid, cchan, seek);
            return;
        });
    }

    let connection = Voice.getVoiceConnection(guildid);

    if (!connection) {
        let guild = bot.guilds.cache.get(guildid);
        connection = Voice.joinVoiceChannel({
            channelId: cchan,
            guildId: guildid,
            adapterCreator: guild.voiceAdapterCreator,
        });

        connection.on(Voice.VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    Voice.entersState(
                        connection,
                        Voice.VoiceConnectionStatus.Signalling,
                        500
                    ),
                    Voice.entersState(
                        connection,
                        Voice.VoiceConnectionStatus.Connecting,
                        500
                    ),
                ]);
            } catch (error) {
                try {
                    if (connection) {
                        connection?.destroy();
                    }
                    queue.songs = [];
                    queue.played = [];
                    if (queue.player) {
                        queue.player?.stop();
                    }
                    queue.player = "";
                    queue.playing = false;
                    queue.playingMessage?.delete().catch(console.error);
                    queueBed.fields = [];
                    let announce = {
                        name: "Player disconnected.",
                        value: "Queue deleted.",
                    };
                    queueBed.fields.push(announce);
                    queue.playingMessage = await queue.textChannel
                        .send({ embeds: [queueBed] })
                        .catch(console.error);
                    queue.voiceChannel = "";
                    queue.textChannel = "";
                } catch (error) {
                    console.log(error);
                }
            }
            return;
        });

        let guildObject = bot.guilds.cache.get(guildid);
        let channelObject = guildObject.channels.cache.get(cchan);
        queue.textChannel = guildObject.channels.cache.find(
            (channel) =>
                channel.name.toLowerCase() ==
                    channelObject.name.toLowerCase().replace(/\s+/g, "-") &&
                channel.parentId == channelObject.parentId &&
                channel.type == "GUILD_TEXT"
        );
        queue.voiceChannel = cchan;
    }

    playSingle(queue.songs[0]?.url, guildid, cchan, seek);
    return;
}

async function playSingle(text, guildid, cchan, seek) {
    let queue = await musicQueue.get(guildid);

    if (queue.songs.length == 0) {
        queue.playing = false;
    }

    if (!text) {
        if (queue.dctime) {
            return;
        }

        queue.player?.stop();
        queue.dctime = setTimeout(() => {
            queue.voiceChannel = "";
            queue.textChannel = "";
            queue.played = [];
            const connection = Voice.getVoiceConnection(guildid);
            if (connection) {
                try {
                    connection?.destroy();
                } catch (error) {
                    console.log(error);
                }
            }
            if (queue.player) {
                try {
                    queue.player?.stop();
                    queue.player = "";
                } catch (error) {
                    console.log(error);
                }
            }
        }, 2.5 * 60 * 1000);

        queue.playing = false;
        updatePlaying(queue, guildid);
        return;
    }

    if (queue.dctime) {
        clearTimeout(queue.dctime);
        queue.dctime = "";
    }

    let stream = "";
    try {
        stream = await ytdl.stream(queue.songs[0]?.url, {
            seek: seek ? seek : 0,
        });
    } catch (error) {
        console.log(error);
        if (error.message.includes("Seeking beyond limit")) {
            skip(queue, cguild, cchan);
        }
        return;
    }

    queue.player.play(
        Voice.createAudioResource(stream.stream, {
            inputType: stream.type,
        })
    );
    const connection = Voice.getVoiceConnection(guildid);
    connection.subscribe(queue.player);

    queue.playing = true;
    updatePlaying(queue, guildid);
    return;
}

function raidRender(roleid) {
    return;
}

async function execute(query) {
    let toons;
    try {
        await new Promise((resolve, reject) => {
            this.client.connect((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            this.client.beginTransaction((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        try {
            toons = await new Promise((resolve, reject) => {
                this.client.query(query, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            await new Promise((resolve, reject) => {
                this.client.commit((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (err) {
            await new Promise((resolve, reject) => {
                this.client.rollback(() => {
                    reject(err);
                });
            });
            console.error(err);
            return "DBERROR";
        } finally {
            this.client.end();
        }
    } catch (e) {
        console.error(e);
    }
    return toons;
}

const classIdMap = new Map();
classIdMap.set(1, "WARR");
classIdMap.set(2, "PALA");
classIdMap.set(3, "HUNT");
classIdMap.set(4, "ROG");
classIdMap.set(5, "PRIEST");
classIdMap.set(6, "DK");
classIdMap.set(7, "SHAM");
classIdMap.set(8, "MAGE");
classIdMap.set(9, "LOCK");
classIdMap.set(10, "MONK");
classIdMap.set(11, "DRUID");

function getClassById(id) {
    return classIdMap.get(parseInt(id));
}

const useMoji = [
    [`239631525350604801`, `🎵`, `🎵`],
    [`163763233633599488`, `🦾`, `🦾`],
    [`823598978695823421`, `🕵️`, `🕵️`],
    [`217792819467649025`, `🦉`, `🦉`],
    [
        `381963187995803650`,
        `<:stipec:832035965471948832>`,
        `<:stipec:832035965471948832>`,
    ],
    [
        `319128664291672085`,
        `<:nunu:832034858535616583>`,
        `<:nunu:832034858535616583>`,
    ],
    [`693435526317080586`, `🐑`, `🐑`],
    [
        `267703536794468352`,
        `<:jayninja:940497925346328657>`,
        `<:jayninja:940497925346328657>`,
    ],
    [`222361901751992320`, `<:dumbunguseo:959889920934178836> Dumbunguseo`, ``],
    [
        `726128183329554463`,
        `<:skap:934312877010075668>`,
        `<:skap:934312877010075668>`,
    ],
    [`361157984551698433`, `🥳`, `🥳`],
    [
        `697474185437642803`,
        `<:LISTI:940450304476975164>`,
        `<:LISTI:940450304476975164>`,
    ],
    [
        `707708230297714758`,
        `<:cunning:942875314097360956>`,
        `<:cunning:942875314097360956>`,
    ],
    [
        `378867539683311636`,
        `<:lichie:944004511662481448>`,
        `<:lichie:944004511662481448>`,
    ],
    [`187303983109373952`, `🅱🅿️`, ``],
    [`303489435792703489`, `🐀`, ``],
];

async function channelChange(user, message) {
    let mesg = ``;
    useMoji.forEach((element) => {
        if (element[0] == user.id && element[2] == ``) {
            mesg += `${element[1]}** ${message} **`;
        } else if (element[0] == user.id) {
            mesg += `${element[1]}** ${user.displayName} ${message} **${element[2]}`;
        }
    });

    if (mesg == ``) {
        mesg = `** ${user.displayName} ${message} **`;
    }

    let channelBed = { description: `${mesg}`, color: `3066993` };
    return channelBed;
}

async function updateCharacter(char, uid, addBed) {
    char = char.toLowerCase();

    var valClassId = await getCharClass(char);

    if (valClassId.classID == -1) {
        let charIndex = allChars.findIndex((c) => c.character == char);
        allChars.splice(charIndex, 1);
        addBed.fields.push({
            name: `${crossmoji} ${char.toUpperCase()}\n`,
            value: "\n**Postava**\n**odstránená**\n",
            inline: true,
        });
        var queryString = `DELETE FROM \`toons\` WHERE \`CHARACTER\` = '${char.toLowerCase()}' AND \`DISCORDID\` = '${uid}';`;
        await execute(queryString);
        return addBed;
    }

    //TODO TOTO SA ASI DA NARAZ ???
    var ilvl = await getIlvl(char);

    if (isNaN(ilvl)) {
        ilvl = 0;
    }

    var tank = false;
    var mdmg = false;
    var rdmg = false;
    var heal = false;

    var classSpecCombo1 = `${valClassId.classID}-${valClassId.classSpec1}`;
    var classSpecCombo2 = `${valClassId.classID}-${valClassId.classSpec2}`;

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

    var queryString = `UPDATE toons 
  SET tank = '${tank}',
      heal = '${heal}',
      mdps = '${mdmg}',
      rdps = '${rdmg}',
      classid = '${valClassId.classID}',
      ilvl = ${ilvl}
      WHERE character = '${char.toLowerCase()}' AND discordid = '${uid}'
      RETURNING id, discordid, character, tank, heal, mdps, rdps, classid, ilvl`;

    let exe = await execute(queryString);

    if (exe) {
        exe.forEach((row) => {
            let charIndex = allChars.findIndex(
                (char) => char.character == row.character
            );
            if (util.isDeepStrictEqual(allChars[charIndex], row)) {
                if (
                    allChars[charIndex].character == "smoothie" ||
                    allChars[charIndex].character == "retaasdosda"
                ) {
                    console.log("same");
                }
                return;
            }
            addBed.fields.push({
                name: `${checkmoji} ${row.character.toUpperCase()} ${checkmoji}\n`,
                value: `**ILVL: ${allChars[charIndex].ilvl} >> ${row.ilvl}**`,
                inline: true,
            });
            allChars.splice(charIndex, 1, row);
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
    return addBed;
}

async function addCharacter(char, uid, addBed) {
    char = char.toLowerCase();

    var charExist = await findChar(uid, char);

    if (charExist) {
        addBed.fields.push({
            name: `${crossmoji} ${char.toUpperCase()}\n`,
            value: "\n**Postava už**\n**je zaregistrovana**\n",
            inline: true,
        });
        return addBed;
    }

    var valClassId = await getCharClass(char);
    console.log("valclas", valClassId);

    if (valClassId.classID == -1) {
        addBed.fields.push({
            name: `${crossmoji} ${char.toUpperCase()}\n`,
            value: "\n**Postava**\n**neexistuje**\n",
            inline: true,
        });
        return addBed;
    }

    //TODO TOTO SA ASI DA NARAZ ???
    var ilvl = valClassId.ilvl;

    if (isNaN(ilvl)) {
        ilvl = 0;
    }

    var tank = false;
    var mdmg = false;
    var rdmg = false;
    var heal = false;

    var classSpecCombo1 = `${valClassId.classID}-${valClassId.classSpec1}`;
    var classSpecCombo2 = `${valClassId.classID}-${valClassId.classSpec2}`;

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

    var queryString = `INSERT INTO toons (discordid, \`character\`, tank, heal, mdps, rdps, classid, ilvl)
    VALUES ('${uid}', '${char.toLowerCase()}', '${tank ? 1 : 0}','${
        heal ? 1 : 0
    }','${mdmg ? 1 : 0}','${rdmg ? 1 : 0}','${valClassId.classID}', '${ilvl}')
    RETURNING id, discordid, \`character\`, tank, heal, mdps, rdps, classid, ilvl`;

    let exe = await execute(queryString);

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

async function removeCharacter(char, uid) {
    var finalMessage = "";
    char = char.toLowerCase();
    var charExist = await findChar(uid, char);

    if (!charExist) {
        finalMessage += `\`\`\`${crossmoji}POSTAVA: ${char.toUpperCase()} NIE JE ZAREGISTROVANA\`\`\``;
        return finalMessage;
    }

    var queryString = `DELETE FROM \`toons\` WHERE \`CHARACTER\` = '${char.toLowerCase()}' AND \`DISCORDID\` = '${uid}';`;

    let exe = await execute(queryString);

    if (exe == "DBERROR") {
        finalMessage += `\`\`\`${crossmoji}DATABASE ERROR\`\`\``;
        return finalMessage;
    }

    allChars = allChars.filter(
        (zachar) => !(zachar.character == char && zachar.discordid == uid)
    );

    finalMessage += `\`\`\`${checkmoji}POSTAVA: ${char.toUpperCase()} ODSTRANENA${checkmoji}\`\`\``;
    return finalMessage;
}

function aGet(url) {
    return axios.get(url);
}

async function getID(chars, raidString, idBed, freeOnly) {
    let endpoints = [];
    let idBeds = [];
    let cName = "";
    let valArray = [];
    let requestNumber = 1;

    for await (const char of chars) {
        if (requestNumber % 30 == 0) {
            await delay(10000);
        }
        requestNumber++;
        let charUrl = `https://mop-twinhead.twinstar.cz/?character=${char.name}&realm=Helios`;
        endpoints.push(aGet(charUrl));
    }

    idBeds.push(Object.create(idBed));

    let index = -1;
    let idBedIndex = 0;
    let length = 0;

    await Promise.all(endpoints)
        .then(function (response) {
            for (const resp of response) {
                let ilvl;
                index += 1;
                let script = "";
                let subsLeft = "";
                let subs = "";
                let classid;
                let classicon;

                cName = chars[index].name;
                let charUrl = `https://mop-twinhead.twinstar.cz/?character=${cName}&realm=Helios`;
                let armoryUrl = `https://twinstar-api.twinstar-wow.com/character/?name=${cName}&realm=Helios`;
                ilvl = chars[index].ilvl;
                classid = chars[index].classid;
                length = chars.length - 1;

                try {
                    script = resp.data.toString();
                    if (script.search("Character ") == -1) {
                        valArray.push({
                            name: `${crossmoji} ${cName.toUpperCase()}\n`,
                            value: "\n\u2800\n**Postava neexistuje**\n",
                            inline: true,
                        });
                        continue;
                    }
                    subsLeft = script.substring(script.indexOf(raidString));
                    subs = subsLeft.substring(0, subsLeft.indexOf("}] });"));
                } catch (e) {
                    console.log(e);
                    if (e.name == "TypeError") {
                        valArray.push({
                            name: `${crossmoji} ${cName.toUpperCase()}\n`,
                            value: "\n\u2800\n**Postava neexistuje**\n",
                            inline: true,
                        });
                        console.log(e);
                        continue;
                    }
                }

                let bossKills;

                if (ilvl == 0) ilvl = "#";

                if (classid !== undefined) {
                    classicon = `\n${classes[classid - 1][1]} **(${ilvl})**`;
                } else {
                    classicon = "";
                }

                try {
                    bossKills = JSON.parse(subs.split("data: ")[1] + "}]");
                } catch (e) {
                    console.log(e);
                    valArray.push({
                        name: `${checkmoji} ${cName.toUpperCase()} ${checkmoji}\n`,
                        value: `\n[${classicon}](${charUrl})\n[[ARMORY](${armoryUrl})]\n**Postava nemá**\n**žiadny relevantný**\n**bosskill**\n\u2800\n\u2800\n--------`,
                        inline: true,
                    });
                    continue;
                }

                // 2022/01/25 20:35:18
                let dateData = bossKills[0].time.split(" ");

                let datePart = dateData[0].split("/");
                let timePart = dateData[1].split(":");

                let year = parseInt(datePart[0]);
                let month = parseInt(datePart[1]);
                let day = parseInt(datePart[2]);
                let hours = parseInt(timePart[0]);
                let minutes = parseInt(timePart[1]);
                let seconds = parseInt(timePart[2]);

                let date = new Date(
                    Date.UTC(year, month - 1, day, hours - 1, minutes, seconds)
                );

                let today = new Date();

                let lastWed = new Date();
                lastWed.setUTCDate(
                    lastWed.getUTCDate() - ((lastWed.getUTCDay() + 4) % 7)
                );
                lastWed.setUTCHours("5", "0", "0");

                if (
                    lastWed.getDay() == today.getDay() &&
                    lastWed.getMonth() == today.getMonth() &&
                    lastWed.getFullYear() == today.getFullYear() &&
                    today.getHours() < 4
                ) {
                    lastWed.setUTCDate(lastWed.getUTCDate() - 7);
                }

                let nextWed = new Date();
                nextWed.setUTCDate(lastWed.getUTCDate() + 7);
                nextWed.setUTCHours("5", "0", "0");

                ilvl = Math.round(parseFloat(bossKills[0].avg_item_lvl));
                classid = Math.round(parseFloat(bossKills[0].class));

                if (ilvl == 0) ilvl = "#";

                if (classid !== undefined) {
                    classicon = `\n${classes[classid - 1][1]} **(${ilvl})**`;
                } else {
                    classicon = "";
                }

                if (date.getTime() > lastWed.getTime()) {
                    if (freeOnly) continue;
                    valArray.push({
                        name: `${crossmoji} ${cName.toUpperCase()}\n`,
                        value: `[${classicon}](${charUrl})\n[[ARMORY](${armoryUrl})]\nLast Bosskill\n${
                            bossKills[0].bossname
                        }\n${bossKills[0].difficulty}\n${date.toLocaleString(
                            "sk-SK",
                            {
                                timeZone: "Europe/Bratislava",
                            }
                        )}\n\n--------`,
                        inline: true,
                    });
                } else {
                    valArray.push({
                        name: `${checkmoji} ${cName.toUpperCase()}\n`,
                        value: `[${classicon}](${charUrl})\n[[ARMORY](${armoryUrl})]\nLast Bosskill\n${
                            bossKills[0].bossname
                        }\n${bossKills[0].difficulty}\n${date.toLocaleString(
                            "sk-SK",
                            {
                                timeZone: "Europe/Bratislava",
                            }
                        )}\n\n--------`,
                        inline: true,
                    });
                }
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        });

    valArray.sort(compareRows);

    for (const value of valArray) {
        idBeds[idBedIndex].fields.push(value);

        if (idBeds[idBedIndex].fields.length >= 18) {
            idBeds.push(Object.create(idBed));
            idBeds[idBedIndex].fields =
                idBeds[idBedIndex].fields.sort(compareRows);

            idBeds[idBedIndex + 1].fields = [];
            idBeds[idBedIndex + 1].title = null;
            idBeds[idBedIndex + 1].description = null;
            idBeds[idBedIndex + 1].author = null;

            idBedIndex++;
        }
    }

    if (idBeds[idBedIndex].fields.length == 0) {
        idBedIndex--;
        idBeds.pop();
    }

    idBeds[idBedIndex].footer = {
        icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
        text: "powered by SMObot.",
    };

    if (
        idBeds[idBedIndex].fields.length % 3 != 0 &&
        idBeds[idBedIndex].fields.length > 1
    ) {
        let more = idBeds[idBedIndex].fields.length % 3;
        for (let index = 0; index < 3 - more; index++) {
            idBeds[idBedIndex].fields.push({
                //name: `--=TOBEESTABLISHED=--\n`,
                //value: `\n\u2800\n**A character**\n**could be here**\n**if you stopped**\n**being lazy and**\n**made one.**\n\u2800\n\u2800\n--------`,
                name: "=====EMPTY=====",
                value: "```\n+---------------+\n|               |\n|               |\n|               |\n|               |\n|               |\n|               |\n+---------------+```",
                inline: true,
            });
        }
    }

    idBeds[idBedIndex].timestamp = Date.now();

    return idBeds;
}

async function sendRaidChars(user, uid) {
    let dmcan = await user.createDM();
    let id = 0;

    let sendChars = [];
    let userChars = await getCharsById(user.id);
    console.log(user.id);
    console.log(uid);
    console.log(userChars);

    let john = new MessageSelectMenu()
        .setCustomId(`33-${uid}`)
        .setPlaceholder("Nothing selected");

    userChars.forEach((character) => {
        john.addOptions({
            label: `${
                character.character.charAt(0).toUpperCase() +
                character.character.slice(1)
            }\n`,
            description: `Ilvl: ${character.ilvl}`,
            value: character.character,
            emoji: classes[character.classid - 1][1],
        });
        id++;
    });

    john.setMinValues(1).setMaxValues(userChars.length);

    const row = await new MessageActionRow().addComponents(john);

    dmcan.send({
        content: "`PICK A CHARACTER FOR THE RAID`",
        components: [row],
    });

    if (collectorMap.has(user)) {
        if (collectorMap.get(user)) {
            collectorMap.get(user).stop();
        }
        collectorMap.delete(user);
    }

    const collector = dmcan.createMessageCollector();
    collectorMap.set(user, collector);

    collector.on("collect", async (m) => {
        let splitCollected = m.content.split(" ");

        splitCollected.forEach((split) => {
            if (userChars[parseInt(split)]) {
                sendChars.push(userChars[parseInt(split)]);
            }
        });

        if (splitCollected.includes("DELETE")) {
            collector.stop();
            await dmcan.send({ content: "Deleted." });
            return;
        }
    });
}

async function getChars() {
    return allChars.sort(compareObjects).sort(compareClasses);
}

async function getCharsById(id) {
    return allChars
        .filter((char) => char.discordid == id)
        .sort(compareObjects)
        .sort(compareClasses);
}

async function getCharsByIdAndClassOrRole(id, element) {
    if (!isNaN(parseInt(element))) {
        return allChars
            .filter((char) => char.discordid == id)
            .filter((char) => char.classid == element)
            .sort(compareObjects)
            .sort(compareClasses);
    } else {
        if (element == "offtank") {
            return allChars
                .filter((char) => char.discordid == id)
                .filter(
                    (char) =>
                        char.tank == true &&
                        (char.mdps == true || char.rdps == true)
                )
                .sort(compareObjects)
                .sort(compareClasses);
        } else if (element == "dps") {
            return allChars
                .filter((char) => char.discordid == id)
                .filter((char) => char.mdps == true || char.rdps == true)
                .sort(compareObjects)
                .sort(compareClasses);
        } else {
            return allChars
                .filter((char) => char.discordid == id)
                .filter((char) => char[element] == true)
                .sort(compareObjects)
                .sort(compareClasses);
        }
    }
}

async function getCharsByIdAndClassAndRole(id, role, classa) {
    if (role == "offtank") {
        return allChars
            .filter((char) => char.discordid == id)
            .filter((char) => char.classid == classa)
            .filter(
                (char) =>
                    char.tank == true &&
                    (char.mdps == true || char.rdps == true)
            )
            .sort(compareObjects)
            .sort(compareClasses);
    } else if (role == "dps") {
        return allChars
            .filter((char) => char.discordid == id)
            .filter((char) => char.classid == classa)
            .filter((char) => char.mdps == true || char.rdps == true)
            .sort(compareObjects)
            .sort(compareClasses);
    } else {
        return allChars
            .filter((char) => char.discordid == id)
            .filter((char) => char.classid == classa)
            .filter((char) => char[role] == true)
            .sort(compareObjects)
            .sort(compareClasses);
    }
}

async function findChar(id, char) {
    let query = `SELECT * FROM \`toons\` WHERE \`character\` = '${char}' AND \`discordid\` = '${id}'`;
    try {
        const x = await execute(query);
        console.log("DATABASE FINDCHAR THINGI", x);
        if (x.length === 0) {
            return false;
        } else {
            return true;
        }
    } catch (err) {
        console.log("Database FINDCHAR" + err);
    }
}

async function getIlvl(char) {
    let endpoints = [];
    let cName;
    let ilvl;

    if (Array.isArray(char)) {
        char.forEach((charName) => {
            let charUrl = `https://mop-twinhead.twinstar.cz/?character=${charName}&realm=Helios`;
            endpoints.push(aGet(charUrl));
        });
    } else {
        let charUrl = `https://mop-twinhead.twinstar.cz/?character=${char}&realm=Helios`;
        endpoints.push(aGet(charUrl));
        cName = char;
    }

    let index = -1;
    let length = 0;

    await Promise.all(endpoints)
        .then(async function (response) {
            for await (const resp of response) {
                index += 1;
                let script = "";
                let subsLeft = "";
                let subs = "";

                if (Array.isArray(char)) {
                    cName = char[index];
                    length = char.length - 1;
                }

                try {
                    script = resp.data.toString();
                    subsLeft = script.substring(
                        script.indexOf("ds-statistic',")
                    );
                    subs = subsLeft.substring(
                        subsLeft.indexOf('avg_item_lvl":"') + 15
                    );
                    ilvl = subs.substring(0, subs.indexOf('"'));
                } catch (e) {
                    if (e.name == "TypeError") {
                        return 0;
                    }
                }
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        });
    return Math.round(parseFloat(ilvl));
}

async function getCharClass(char) {
    let toonUrl = `https://twinstar-api.twinstar-wow.com/character/?name=${char}&realm=Helios`;
    let classID;
    let classSpec1;
    let classSpec2;
    let ilvl;
    await axios
        .get(toonUrl)
        .catch((error) => {
            if (error.message.includes("unescaped")) {
                sprava.channel.send("```Nauč sa písať ty mongol.```");
            } else if (error.message.includes("403")) {
                sprava.channel.send("```Nepíš sem sračky plox.```");
            }
        })
        .then(async function (response) {
            try {
                classID = response.data.class;
                classSpec1 =
                    response.data.talents.talentTree[0].name ?? undefined;
                classSpec2 =
                    response.data.talents.talentTree[1].name ?? undefined;
                ilvl = Math.round(response.data.averageItemLevel) ?? undefined;
                return {
                    classID: classID,
                    classSpec1: classSpec1,
                    classSpec2: classSpec2,
                    ilvl: ilvl,
                };
            } catch (e) {
                if (e.name == "TypeError") {
                    console.log(e);
                    classID = -1;
                    return {
                        classID,
                        classSpec1: undefined,
                        classSpec2: undefined,
                        ilvl: -1,
                    };
                }
            }
        });
    return {
        classID: classID,
        classSpec1: classSpec1,
        classSpec2: classSpec2,
        ilvl: ilvl,
    };
}

function compareNames(a, b) {
    var nameA = a.guild.name.toUpperCase(); // ignore upper and lowercase
    var nameB = b.guild.name.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }

    return 0;
}

function compareObjects(a, b) {
    var nameA = a.character; // ignore upper and lowercase
    var nameB = b.character; // ignore upper and lowercase
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }

    return 0;
}

function compareClasses(a, b) {
    var nameA = a.classid; // ignore upper and lowercase
    var nameB = b.classid; // ignore upper and lowercase
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }

    return 0;
}

function compareRows(a, b) {
    var nameA = JSON.stringify(a.name);
    var nameB = JSON.stringify(b.name);
    if (nameA.includes(crossmoji) && !nameB.includes(crossmoji)) {
        return 1;
    }
    if (nameB.includes(crossmoji) && !nameA.includes(crossmoji)) {
        return -1;
    }

    return 0;
}

var collectorMap = new Map();
var raidRoomMap = [];

function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

let emoguild = "";

bot.on("ready", async () => {
    bot.user.setActivity("SMObot je láska", { type: "PLAYING" });

    const text = `
    CREATE TABLE IF NOT EXISTS \`toons\` (
      \`id\` INT AUTO_INCREMENT,
      \`discordid\` VARCHAR(25) NOT NULL,
      \`character\` VARCHAR(20) NOT NULL,
      \`tank\` BOOLEAN NOT NULL,
      \`heal\` BOOLEAN NOT NULL,
      \`mdps\` BOOLEAN NOT NULL,
      \`rdps\` BOOLEAN NOT NULL,
      \`classid\` INT NOT NULL,
      \`ilvl\` INT NOT NULL,
      PRIMARY KEY (\`id\`)
    );
    `;

    await execute(text);

    const {
        SlashCommandBuilder,
        ContextMenuCommandBuilder,
    } = require("@discordjs/builders");
    const { REST } = require("@discordjs/rest");
    const { Routes } = require("discord-api-types/v9");

    emoguild = bot.guilds.cache.get(process.env.EMOJIID);
    testguild = bot.guilds.cache.get(process.env.TESTID);
    let logchannel = testguild.channels.cache.find(
        (channel) => channel.name == "log"
    );

    let crashBed = { description: ``, color: `0xff0000` };
    crashBed.title = "Application crashed via uncaught exception.";
    crashBed.fields = [];

    let testrole = testguild.roles.cache.find(
        (role) => role.name == "SBTESTER"
    );
    testerUsers = testrole?.members?.map((member) => member.user.id);
    if (!testerUsers) {
        testerUsers = [];
    }
    console.log(testerUsers);

    classes.forEach(async (classe) => {
        classe[1] = await emoguild?.emojis?.cache.find(
            (emoji) => emoji.name === classe[0]
        );
    });

    crossmoji = await emoguild.emojis.cache.find(
        (emoji) => emoji.name === "TIMEX"
    );
    checkmoji = await emoguild.emojis.cache.find(
        (emoji) => emoji.name === "TIMEY"
    );

    const raidQuery = `
    CREATE TABLE IF NOT EXISTS \`raids\` (
      \`raidid\` VARCHAR(22),
      \`info\` json NOT NULL,
      PRIMARY KEY (\`raidid\`)
    );
    `;

    await execute(raidQuery);

    let res = await execute(`SELECT * FROM toons`);

    res?.forEach((row) => {
        allChars.push(row);
    });

    // await execute(`DROP TABLE IF EXISTS TOONS`);

    // allChars.forEach((element) => {
    //     let queryString = `INSERT INTO toons(
    //     discordid, character, tank, heal, mdps, rdps, classid, ilvl
    //     ) VALUES (
    //     '${element.discordid}', '${element.character.toLowerCase()}', '${
    //         element.tank
    //     }','${element.heal}','${element.mdps}','${element.rdps}','${
    //         element.classid
    //     }', '${element.ilvl}'
    //     ) RETURNING id, discordid, character, tank, heal, mdps, rdps, classid, ilvl`;

    //     execute(queryString);
    // });

    let raidInfo = await execute(`SELECT * FROM raids`);

    if (raidInfo) {
        raidInfo.forEach((row) => {
            allRaids.push(row);
        });
    }

    console.log(allRaids);

    const commands = [
        new SlashCommandBuilder()
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
                subcommand
                    .setName("skip")
                    .setDescription("skips currently playing song")
            )
            .addSubcommand((subcommand) =>
                subcommand.setName("pause").setDescription("pause the music")
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("continue")
                    .setDescription("continue playing the music")
            ),
        new SlashCommandBuilder()
            .setName("lfm")
            .setDescription(
                "Creates a raid announce to be sent to subscribed guilds."
            )
            .addStringOption((option) =>
                option
                    .setName("raid")
                    .setDescription("the raid you are assembling")
                    .setRequired(true)
                    .addChoice("Terrace of Endless Spring", "TOES")
                    .addChoice("Heart of Fear", "HOF")
                    .addChoice("Mogu'shan Vaults", "MSV")
            )
            .addStringOption((option) =>
                option
                    .setName("hc")
                    .setDescription("Number of heroic bosses")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("roles")
                    .setDescription("What you are looking for")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("time")
                    .setDescription("When is the raid happening")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("day")
                    .setDescription("What day is the raid on")
                    .setRequired(false)
            )
            .addStringOption((option) =>
                option
                    .setName("info")
                    .setDescription("Loot info or other details")
                    .setRequired(false)
            )
            .addStringOption((option) =>
                option
                    .setName("size")
                    .setDescription("10/25 man")
                    .setRequired(false)
                    .addChoice("10", "10m")
                    .addChoice("25", "25m")
            )
            .addUserOption((option) =>
                option
                    .setName("leader")
                    .setDescription("The Raid Leader (if it's not you)")
                    .setRequired(false)
            ),
        new SlashCommandBuilder()
            .setName("addchar")
            .setDescription(
                "Adds WOW character into a database of your characters"
            )
            .addStringOption((option) =>
                option
                    .setName("character")
                    .setDescription("the name of your character")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("character2")
                    .setDescription("the name of your character")
                    .setRequired(false)
            )
            .addStringOption((option) =>
                option
                    .setName("character3")
                    .setDescription("the name of your character")
                    .setRequired(false)
            )
            .addStringOption((option) =>
                option
                    .setName("character4")
                    .setDescription("the name of your character")
                    .setRequired(false)
            )
            .addStringOption((option) =>
                option
                    .setName("character5")
                    .setDescription("the name of your character")
                    .setRequired(false)
            )
            .addMentionableOption((option) =>
                option
                    .setName("userId")
                    .setDescription("user that owns the character")
                    .setRequired(false)
            ),
        new SlashCommandBuilder()
            .setName("update")
            .setDescription("Update Characters")
            .addStringOption((option) =>
                option
                    .setName("character")
                    .setDescription("the name of your character")
                    .setRequired(false)
            ),
        new SlashCommandBuilder()
            .setName("removechar")
            .setDescription(
                "Removes a WOW character from a database of your characters"
            )
            .addStringOption((option) =>
                option
                    .setName("character")
                    .setDescription("the name of your character")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("character2")
                    .setDescription("the name of your character")
                    .setRequired(false)
            )
            .addStringOption((option) =>
                option
                    .setName("character3")
                    .setDescription("the name of your character")
                    .setRequired(false)
            )
            .addStringOption((option) =>
                option
                    .setName("character4")
                    .setDescription("the name of your character")
                    .setRequired(false)
            )
            .addStringOption((option) =>
                option
                    .setName("character5")
                    .setDescription("the name of your character")
                    .setRequired(false)
            ),
        new SlashCommandBuilder()
            .setName("id")
            .setDescription("Get raid lock statistics of your characters")
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("all")
                    .setDescription("all of your characters from the database")
                    .addStringOption((option) =>
                        option
                            .setName("raid")
                            .setDescription(
                                "the raid you want lockout status for"
                            )
                            .addChoice("Terrace of Endless Spring", "toes")
                            .addChoice("Heart of Fear", "hof")
                            .addChoice("Mogu'shan Vaults", "msv")
                            .setRequired(true)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("position")
                            .setDescription("raid position")
                            .addChoice("🛡️ TANK 🛡️", "tank")
                            .addChoice("💊 HEAL 💊", "heal")
                            .addChoice("💀 DPS 💀", "dps")
                            .addChoice("🔪 OFFTANK 🛡️", "offtank")
                            .addChoice("⚔️ MDPS ⚔️", "mdps")
                            .addChoice("🎯 RDPS 🎯", "rdps")
                            .setRequired(false)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("class")
                            .setDescription("character class")
                            .addChoice("⚔️ Warrior ⚔️", "1")
                            .addChoice("😇 Paladin 😇", "2")
                            .addChoice("🏹 Hunter 🏹", "3")
                            .addChoice("🗡️ Rogue 🗡️", "4")
                            .addChoice("⛪ Priest ⛪", "5")
                            .addChoice("🩸 Death Knight 🩸", "6")
                            .addChoice("⚡ Shaman ⚡", "7")
                            .addChoice("🎲 Mage 🎲", "8")
                            .addChoice("👿 Warlock 👿", "9")
                            .addChoice("🐻 Druid 🐻", "11")
                            .setRequired(false)
                    )
                    .addBooleanOption((option) =>
                        option
                            .setName("freeonly")
                            .setDescription(
                                "whether or not to show only characters with free id"
                            )
                            .setRequired(false)
                    )
                    .addBooleanOption((option) =>
                        option
                            .setName("public")
                            .setDescription(
                                "whether or not you want to make the output publicly visible"
                            )
                            .setRequired(false)
                    )
                    .addUserOption((option) =>
                        option
                            .setName("userid")
                            .setDescription("the user you want bosskills from")
                            .setRequired(false)
                    )
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("character")
                    .setDescription("single character")
                    .addStringOption((option) =>
                        option
                            .setName("raid")
                            .setDescription(
                                "the raid you want lockout status for"
                            )
                            .addChoice("Terrace of Endless Spring", "toes")
                            .addChoice("Heart of Fear", "hof")
                            .addChoice("Mogu'shan Vaults", "msv")
                            .setRequired(true)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("character")
                            .setDescription("your character name")
                            .setRequired(true)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("character1")
                            .setDescription("your character name")
                            .setRequired(false)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("character2")
                            .setDescription("your character name")
                            .setRequired(false)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("character3")
                            .setDescription("your character name")
                            .setRequired(false)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("character4")
                            .setDescription("your character name")
                            .setRequired(false)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("character5")
                            .setDescription("your character name")
                            .setRequired(false)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("character6")
                            .setDescription("your character name")
                            .setRequired(false)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("character7")
                            .setDescription("your character name")
                            .setRequired(false)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("character8")
                            .setDescription("your character name")
                            .setRequired(false)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("character9")
                            .setDescription("your character name")
                            .setRequired(false)
                    )
                    .addBooleanOption((option) =>
                        option
                            .setName("public")
                            .setDescription(
                                "whether or not you want to make the output publicly visible"
                            )
                            .setRequired(false)
                    )
            ),
    ].map((command) => command.toJSON());

    const testcommands = [
        new ContextMenuCommandBuilder().setName("play").setType(3),
        new SlashCommandBuilder()
            .setName("lfm2")
            .setDescription(
                "Creates a raid announce to be sent to subscribed guilds."
            )
            .addStringOption((option) =>
                option
                    .setName("raid")
                    .setDescription("the raid you are assembling")
                    .setRequired(true)
                    .addChoice("Terrace of Endless Spring", "TOES")
                    .addChoice("Heart of Fear", "HOF")
                    .addChoice("Mogu'shan Vaults", "MSV")
            )
            .addStringOption((option) =>
                option
                    .setName("hc")
                    .setDescription("Number of heroic bosses")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("roles")
                    .setDescription("What you are looking for")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("time")
                    .setDescription("When is the raid happening")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("day")
                    .setDescription("What day is the raid on")
                    .setRequired(false)
            )
            .addStringOption((option) =>
                option
                    .setName("info")
                    .setDescription("Loot info or other details")
                    .setRequired(false)
            )
            .addStringOption((option) =>
                option
                    .setName("size")
                    .setDescription("10/25 man")
                    .setRequired(false)
                    .addChoice("10", "10m")
                    .addChoice("25", "25m")
            )
            .addUserOption((option) =>
                option
                    .setName("leader")
                    .setDescription("The Raid Leader (if it's not you)")
                    .setRequired(false)
            ),
    ].map((testcommand) => testcommand.toJSON());

    // Place your client and guild ids here
    const clientId = process.env.CLIENTID;
    const guildId = process.env.TESTID;

    const rest = new REST({ version: "9" }).setToken(process.env.DTOKEN);

    (async () => {
        try {
            console.log("Started refreshing application (/) commands.");

            await rest.put(Routes.applicationCommands(clientId), {
                body: commands,
            });

            console.log("Successfully reloaded application (/) commands.");
        } catch (error) {
            console.error(error);
        }
    })();

    (async () => {
        try {
            console.log("Started refreshing guild test (/) commands.");

            await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
                body: testcommands,
            });

            console.log("Successfully reloaded guild test (/) commands.");
        } catch (error) {
            console.error(error);
        }
    })();

    bot.guilds.cache.forEach(async (guildt) => {
        let emo = await guildt.emojis.cache.find(
            (emoji) => emoji.name === "skap"
        );
        if (!emo) {
            guildt.emojis
                .create(
                    "https://i.ibb.co/xjw072D/Discord-Emote-Maker-2.png",
                    "skap"
                )
                .catch(console.error);
        }
    });

    bot.guilds.cache.forEach(async (guildt) => {
        let que = new Queue("", "", "", "", [], [], false, "", false);
        musicQueue.set(guildt.id, que);
    });

    bot.guilds.cache.forEach(async (guildt) => {
        if (
            emoguild.emojis.cache.find(
                (emoji) =>
                    emoji.name ==
                    guildt.name
                        .replace(/[^a-zA-Z ]/g, "")
                        .toUpperCase()
                        .split(" ")[0]
            )
        )
            return;
        emoguild.emojis.create(
            guildt.iconURL(),
            guildt.name
                .replace(/[^a-zA-Z ]/g, "")
                .toUpperCase()
                .split(" ")[0]
        );
    });

    bot.guilds.cache.forEach(async (guildt) => {
        let emo = await guildt.emojis.cache.find(
            (emoji) => emoji.name === "skap"
        );
        if (!emo) {
            guildt.emojis
                .create(
                    "https://i.ibb.co/xjw072D/Discord-Emote-Maker-2.png",
                    "skap"
                )
                .catch(console.error);
        }
    });

    bot.guilds.cache.forEach(async (guildt) => {
        let raidCategory = await guildt.channels.cache.find(
            (channelt) =>
                channelt.name.toLowerCase() == "smo-raid" &&
                channelt.type == "GUILD_CATEGORY"
        );
        if (!raidCategory) {
            guildt.channels.create("SMO-RAID", {
                type: "GUILD_CATEGORY",
                position: 0,
                permissionOverwrites: [
                    {
                        id: testguild.roles.everyone,
                        deny: [Permissions.FLAGS.VIEW_CHANNEL],
                    },
                ],
            });
        }
        let raidChannel = await guildt.channels.cache.find(
            (channelt) =>
                channelt.name.toLowerCase() == "raidy" &&
                channelt.type == "GUILD_TEXT"
        );
        if (raidChannel) {
            console.log(`'${raidChannel.id}'`);
            raidRoomMap.push(raidChannel);
        }
    });
});

bot.on("channelCreate", async (channel) => {
    if (channel.name.toLowerCase() == "raidy") {
        raidRoomMap.push(channel);
        raidRoomMap.sort(compareNames);
    }
});

bot.on("channelDelete", async (channel) => {
    if (channel.name.toLowerCase() == "raidy") {
        const findValue = (element) => element == channel;
        let indx = raidRoomMap.findIndex(findValue);
        if (indx != undefined && indx > -1) {
            raidRoomMap.splice(indx, 1);
        }
        raidRoomMap.sort(compareNames);
    }
});

bot.on("channelUpdate", async (oldChannel, newChannel) => {
    if (oldChannel.name.toLowerCase() == "raidy") {
        const findValue = (element) => element.id == oldChannel.id;
        let indx = raidRoomMap.findIndex(findValue);

        if (indx != undefined && indx > -1) {
            console.log("IMHERE");
            raidRoomMap.splice(indx, 1);
        }
        raidRoomMap.sort(compareNames);
    }

    if (newChannel.name.toLowerCase() == "raidy") {
        raidRoomMap.push(newChannel);
        raidRoomMap.sort(compareNames);
    }
});

bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isSelectMenu()) return;
    if (!interaction?.customId.startsWith("22")) return;

    await interaction.update({
        content: "Character selected.",
        components: [],
    });

    let charsenderid = interaction.customId.split("-")[1];
    let charSender = await bot.users.cache.get(charsenderid);
    let senderChannel = await charSender.createDM();

    let selectedChar = allChars.filter((char) =>
        interaction.values.includes(char.character.toLowerCase())
    );

    let pickBed = {
        title: "Selected Characters",
        description: ``,
        color: 7419530,
        timestamp: Date.now(),
        footer: {
            icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
            text: "powered by SMObot",
        },
        author: {
            name: "Raid Manager (BETA)",
            icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
        },
        fields: [],
    };

    pickBed.fields.push({
        name: `${checkmoji}\n`,
        value: `\n\u2800\n${interaction.user} si na RAID vybral postavu: ${
            classes[selectedChar[0].classid - 1][1]
        } ${selectedChar[0].character
            .charAt(0)
            .toUpperCase()}${selectedChar[0].character.slice(1)}\n\u2800\n`,
    });

    await testBed.fields.push({
        name: "Character",
        value: `${
            classes[selectedChar[0].classid - 1][1]
        } ${selectedChar[0].character
            .charAt(0)
            .toUpperCase()}${selectedChar[0].character.slice(1)}\n\u2800\n`,
    });

    let i = 0;
    raidRoomId.forEach((raidRoomId) => {
        raidRoomId.edit({ content: "@everyone", embeds: [testBed] });
    });
    await senderChannel.send({ embeds: [pickBed] });
});

bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (!interaction.customId) {
        return;
    }

    if (interaction.customId == "raidsign") {
        sendRaidChars(interaction.user, interaction.user.id);
        return;
    }

    if (interaction.customId.includes("sbmusic")) {
        var cchan = interaction.member.voice.channelId;
        var cguild = interaction.guildId;
        var gqueue = musicQueue.get(cguild);
    }

    interaction.deferUpdate();

    if (interaction.customId == "sbmusicplay") {
        await proceed(gqueue, cguild, cchan);
        return;
    }

    if (interaction.customId == "sbmusicpause") {
        await pause(gqueue, cguild);
        return;
    }

    if (interaction.customId == "sbmusicstop") {
        await stop(gqueue, cguild);
        return;
    }

    if (interaction.customId == "sbmusicprev") {
        await prev(gqueue, cguild, cchan);
        return;
    }

    if (interaction.customId == "sbmusicnext") {
        await skip(gqueue, cguild, cchan);
        return;
    }

    if (interaction.customId == "sbmusicautoplay") {
        await autoplay(gqueue, cguild);
        return;
    }
});

bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isSelectMenu()) return;

    if (!interaction?.customId.startsWith("33")) {
        return;
    }

    let charsend = [];
    let charrrs = "";
    let id = 0;
    let smoothie = await bot.users.cache.get("319128664291672085");

    await interaction.update({
        content: "Characters sent to Raid Leader",
        components: [],
    });
    charsend = allChars.filter((char) =>
        interaction.values.includes(char.character.toLowerCase())
    );

    let john = new MessageSelectMenu()
        .setCustomId(`22-${interaction.user.id}`)
        .setPlaceholder("Nothing selected");

    charsend.forEach((character) => {
        john.addOptions({
            label: `${
                character.character.charAt(0).toUpperCase() +
                character.character.slice(1)
            }\n`,
            description: `Ilvl: ${character.ilvl}`,
            value: character.character,
            emoji: classes[character.classid - 1][1],
        });
        id++;
    });

    john.setMinValues(1).setMaxValues(1);

    const row = await new MessageActionRow().addComponents(john);

    smoothie.send({
        content: `\`SELECT A CHARACTER FROM:\` ${interaction.user}`,
        components: [row],
    });
});

bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isAutocomplete()) {
        return;
    }

    let cguild = interaction.guild.id;
    let gqueue = musicQueue.get(cguild);
    let qsongs = gqueue.songs;
    let qplayed = gqueue.played;

    let focus = interaction.options.getFocused().toLowerCase();
    let optsQueue,
        optsPlayed = [];
    optsQueue = qsongs.filter((song) =>
        song.title.toLowerCase().includes(focus)
    );
    optsPlayed = qplayed.filter((song) =>
        song.title.toLowerCase().includes(focus)
    );
    let opts = optsQueue.concat(optsPlayed);

    let response = [];

    opts.forEach((opt) => {
        response.push({
            name: opt.title,
            value: opt.url,
        });
    });

    interaction.respond(response);
});

bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand() && !interaction.isContextMenu()) return;

    if (interaction.isCommand()) {
        var { commandName, options } = interaction;
        try {
            var playnext = options?.getSubcommand() == "playnext";
        } catch (error) {
            var playnext = false;
        }
    } else {
        var { commandName, options: contextOptions } = interaction;
        var playnext = false;
    }

    let raidName = "";
    let raidImage = "";
    let raidShort = "";

    if (commandName === "music" || commandName == "play") {
        const queueBed = {
            title: "Queue",
            color: 0xebb102,
            timestamp: Date.now(),
            footer: {
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
                text: "powered by SMObot",
            },
            author: {
                name: "MUSIC Manager",
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
            },
            fields: [],
        };

        let cchan = interaction.member.voice.channelId;
        let cguild = interaction.guildId;
        let gqueue = musicQueue.get(cguild);

        if (!cchan) {
            musicBed.description = "You must be in voice channel first.";
            await interaction.reply({ embeds: [musicBed], ephemeral: true });
            return;
        }

        if (gqueue.voiceChannel && cchan != gqueue.voiceChannel) {
            musicBed.description = "SMObot is playing in a different channel.";
            await interaction.reply({ embeds: [musicBed], ephemeral: true });
            return;
        }

        //MUSIC QUEUE
        if (options?.getSubcommand() == "queue") {
            let page = options.getInteger("page")
                ? options.getInteger("page")
                : 0;

            if (gqueue.songs.length == 0 && gqueue.played.length == 0) {
                musicBed.description = "Queue is empty.";
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
                return;
            }

            queueBed.title = "";

            if (gqueue.songs.length != 0) {
                let first = gqueue.songs.slice(0, 1);
                let format = first[0].title.replace(
                    /\(official music video\)/gi,
                    ""
                );
                format = format.replace(/\(official video\)/gi, "");
                format = format.replace(/\/official video\//gi, "");
                format = format.replace(/\|official video\|/gi, "");

                queueBed.fields.push({
                    name: `Current song:`,
                    value: `${format}`,
                    inline: false,
                });
            }

            let fullQueue = gqueue.played.concat(gqueue.songs);
            let index = gqueue.played.length + 1;

            if (fullQueue.length <= page * 11) {
                musicBed.description = "No such page in the queue";
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
                return;
            }

            if (index + 5 > fullQueue.length) {
                var rightIndex = fullQueue.length;
                var leftIndex = index - 6 - (index + 5 - fullQueue.length);
            }

            if (index - 6 < 0) {
                var leftIndex = 0;
                var rightIndex = index + 6 + Math.abs(index - 5);
            }

            if (!(index + 5 > fullQueue.length) && !(index - 6 < 0)) {
                var leftIndex = index - 6;
                var rightIndex = index + 5;
            }

            if (page != 0) {
                rightIndex = rightIndex - 11;
                leftIndex = leftIndex - 11;
            }

            let partQueue = fullQueue.slice(leftIndex, rightIndex);

            let songs = "";
            let idx = 0;

            partQueue.forEach((song) => {
                idx++;
                let format = song.title.replace(
                    /\(official music video\)/gi,
                    ""
                );
                format = format.replace(/\(official video\)/gi, "");
                format = format.replace(/\/official video\//gi, "");
                format = format.replace(/\|official video\|/gi, "");
                songs += `\`${idx}.\`  ${format}\n`;
            });

            queueBed.fields.push({
                name: `Queue:`,
                value: songs,
                inline: true,
            });

            await interaction.reply({ embeds: [queueBed], ephemeral: true });
            return;
        }

        //MUSIC SEEK
        if (options?.getSubcommand() == "seek") {
            let add = false;
            let remove = false;
            let time = options.getString("time");
            if (!gqueue.player) {
                musicBed.description = `No music is playing.`;
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
                return;
            }

            let playingDuration = Math.floor(
                gqueue.player._state.resource.playbackDuration / 1000
            );
            let seek = 0;

            if (time.startsWith("+")) {
                add = true;
                time = time.slice(1);
            } else if (time.startsWith("-")) {
                remove = true;
                time = time.slice(1);
            }

            if (time.includes(":")) {
                time = time.split(":");
                if (time.length > 3) {
                    musicBed.description = `Incorrect time format.`;
                    await interaction.reply({
                        embeds: [musicBed],
                        ephemeral: true,
                    });
                    return;
                }
                let index = 0;
                time.reverse().forEach(async (ele) => {
                    if (ele.length > 2 || ele.length < 1) {
                        musicBed.description = `Incorrect time format.`;
                        await interaction.reply({
                            embeds: [musicBed],
                            ephemeral: true,
                        });
                        return;
                    }
                    if (!ele.match(/^\d*$/)) {
                        musicBed.description = `Incorrect time format.`;
                        await interaction.reply({
                            embeds: [musicBed],
                            ephemeral: true,
                        });
                        return;
                    }
                    seek += ele * (60 ^ index);
                    index++;
                });
            } else if (time.match(/^\d*$/)) {
                seek = parseInt(time);
            } else {
                musicBed.description = `Incorrect time format.`;
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
                return;
            }

            if (add) {
                console.log(playingDuration);
                console.log(seek);
                seek = playingDuration + seek;
                console.log(seek);
            }

            if (remove) {
                seek = playingDuration - seek;
                if (seek < 0) {
                    seek = 0;
                }
            }

            try {
                await play(gqueue.songs[0].url, cguild, cchan, seek);
            } catch (error) {
                skip(gqueue, cguild, cchan);
            }

            return;
        }

        //MUSIC AUTOPLAY
        if (options?.getSubcommand() == "autoplay") {
            if (gqueue.autoplay == false) {
                if (gqueue.songs.length == 0 && gqueue.played.length == 0) {
                    musicBed.description = `No leading songs. Add at least one song to the queue`;
                    await interaction.reply({
                        embeds: [musicBed],
                        ephemeral: true,
                    });
                    return;
                }
            }

            await autoplay(gqueue, cguild);
            return;
        }

        //MUSIC REMOVE
        if (options?.getSubcommand() == "remove") {
            let rm = options.getString("song");
            console.log(rm);

            let rmIndex = gqueue.songs.findIndex((song) => song.url == rm);
            let rmIndexPlayed = gqueue.played.findIndex(
                (song) => song.url == rm
            );

            if (rmIndex > 0) {
                musicBed.description = `${gqueue.songs[rmIndex].title} removed from the queue.`;
                await gqueue.songs.splice(rmIndex, 1);
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
            } else if (rmIndex == 0) {
                musicBed.description = `${gqueue.songs[rmIndex].title} removed from the queue.`;
                await gqueue.songs.splice(rmIndex, 1);

                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
                await play(gqueue.songs[0].url, cguild, cchan);
            } else if (rmIndexPlayed >= 0) {
                musicBed.description = `${gqueue.played[rmIndexPlayed].title} removed from the queue.`;
                await gqueue.played.splice(rmIndex, 1);
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
            } else {
                musicBed.description = "No such song in the queue.";
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
            }
            updatePlaying(gqueue, cguild);
            return;
        }

        //MUSIC STOP
        if (options?.getSubcommand() == "stop") {
            const connection = Voice.getVoiceConnection(cguild);
            if (connection) {
                await stop(gqueue, cguild);

                musicBed.description = "Stopped.";
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
                return;
            }
            musicBed.description = "SMObot is not playing anything :(";
            await interaction.reply({ embeds: [musicBed], ephemeral: true });
            return;
        }

        //MUSIC PAUSE
        if (options?.getSubcommand() == "pause") {
            if (gqueue.playing) {
                await pause(gqueue, cguild);
                musicBed.description = "Paused";
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
            } else {
                musicBed.description = "SMObot is not playing anything :(";
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
            }
            return;
        }

        //MUSIC CONTINUE
        if (options?.getSubcommand() == "continue") {
            if (!gqueue.playing) {
                if (gqueue.songs.length == 0) {
                    musicBed.description = "There are no songs in the queue.";
                    await interaction.reply({
                        embeds: [musicBed],
                        ephemeral: true,
                    });
                    return;
                }
                const connection = Voice.getVoiceConnection(cguild);
                if (!(connection && gqueue.player)) {
                    musicBed.description = "Restarting player.";
                    await interaction.reply({
                        embeds: [musicBed],
                        ephemeral: true,
                    });
                    await play(gqueue.songs[0]?.url, cguild, cchan);
                    return;
                }

                await proceed(gqueue, cguild);

                musicBed.description = "Unpaused";
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
            } else {
                musicBed.description = "Smobot is not paused";
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
            }
            return;
        }

        //MUSIC PREV
        if (options?.getSubcommand() == "prev") {
            if (gqueue.played.length == 0) {
                musicBed.description =
                    "There are no previous songs in the queue.";
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
                return;
            }

            await prev(gqueue, cguild, cchan);

            musicBed.description = `Playing ${gqueue.songs[0]?.title}`;
            await interaction.reply({ embeds: [musicBed], ephemeral: true });

            return;
        }

        //MUSIC SKIP
        if (options?.getSubcommand() == "skip") {
            if (gqueue.songs.length == 0) {
                musicBed.description = "There are no songs in the queue.";
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
                return;
            }

            if (gqueue.songs.length == 1) {
                musicBed.description = "No songs to play. Stopping.";
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
                await play("", cguild, cchan);
            }

            await skip(gqueue, cguild, cchan);

            if (gqueue.songs.length > 0) {
                musicBed.description = `Playing ${gqueue.songs[0]?.title}`;
                await interaction.reply({
                    embeds: [musicBed],
                    ephemeral: true,
                });
            }
        }

        //MUSIC PLAY
        if (
            options?.getSubcommand() == "play" ||
            options?.getSubcommand() == "playnext" ||
            commandName == "play"
        ) {
            if (interaction.isCommand()) {
                var song = options.getString("song");
            } else {
                var song = contextOptions.getMessage("message").content;
                if (!song) {
                    musicBed.description = `Invalid message`;
                    await interaction.reply({
                        components: [],
                        embeds: [musicBed],
                        ephemeral: true,
                    });
                    return;
                }
            }

            let url = "";

            if (
                song.startsWith("https") &&
                ytdl.yt_validate(song) === "video"
            ) {
                url = song;
                let info = await ytdl.video_info(url);
                let songObject = new Song(info.video_details.title, url);

                if (gqueue.songs.length == 0) {
                    gqueue.songs.push(songObject);
                    await play(gqueue.songs[0]?.url, cguild, cchan);
                    musicBed.description = `Playing ${songObject.title}`;
                    await interaction.reply({
                        components: [],
                        embeds: [musicBed],
                        ephemeral: true,
                    });
                } else {
                    musicBed.description = `Added ${songObject.title}`;
                    await interaction.reply({
                        components: [],
                        embeds: [musicBed],
                        ephemeral: true,
                    });
                    if (options?.getSubcommand() == "playnext") {
                        await gqueue.songs.splice(1, 0, songObject);
                    } else {
                        await gqueue.songs.push(songObject);
                    }
                }
            } else if (
                song.startsWith("https") &&
                ytdl.yt_validate(song) === "playlist"
            ) {
                let pl = "";
                try {
                    pl = await ytdl.playlist_info(song, { incomplete: true });
                } catch (error) {
                    console.log(error);
                    musicBed.description = `Unsupported playlist`;
                    await interaction.reply({
                        components: [],
                        embeds: [musicBed],
                        ephemeral: true,
                    });
                    return;
                }

                console.log(pl);

                url = pl.videos[0].url;

                musicBed.description = `Playlist added: ${pl.title}`;
                await interaction.reply({
                    components: [],
                    embeds: [musicBed],
                    ephemeral: true,
                });

                if (gqueue.songs.length == 0) {
                    pl.videos.forEach((video) => {
                        let songObject = new Song(video.title, video.url);
                        gqueue.songs.push(songObject);
                    });
                    await play(gqueue.songs[0]?.url, cguild, cchan);
                } else {
                    if (options?.getSubcommand() == "playnext") {
                        let counter = 0;
                        for await (const video of pl.videos) {
                            let songObject = new Song(video.title, video.url);
                            counter++;
                            gqueue.songs.splice(counter, 0, songObject);
                        }
                    } else {
                        for await (const video of pl.videos) {
                            let songObject = new Song(video.title, video.url);
                            gqueue.songs.push(songObject);
                        }
                    }
                }
            } else {
                const filters1 = await ytsr.getFilters(song);
                const filter1 = filters1.get("Type").get("Video");
                const options = {
                    limit: 10,
                    gl: `SK`,
                    hl: `sk`,
                };
                let search = await ytsr(filter1.url, options);
                let searchUrls = search.items;

                const urlTable = new MessageSelectMenu()
                    .setCustomId("mbsongs")
                    .setMinValues(1)
                    .setPlaceholder("Select a song");

                searchUrls.forEach((combo) => {
                    if (combo.title.length > 99) {
                        combo.title = combo.title.slice(0, 95);
                        combo.title += "...";
                    }
                    if (combo.title && combo.url) {
                        urlTable.addOptions({
                            label: String(combo.title),
                            value: String(combo.url),
                        });
                    }
                });

                urlTable.setMaxValues(urlTable.options.length);

                const row = new MessageActionRow().addComponents(urlTable);
                let msg = await interaction.reply({
                    components: [row],
                    ephemeral: true,
                    fetchReply: true,
                });
                const filter = (i) =>
                    i.customId === "mbsongs" &&
                    i.user.id === interaction.user.id;

                gqueue.collectorMsg = msg;
                gqueue.collector = msg
                    .awaitMessageComponent({ filter, time: 60 * 1000 })
                    .then(async (i) => {
                        try {
                            var info = urlTable.options.find(
                                (option) => option.value == i.values[0]
                            );
                        } catch (error) {
                            musicBed.description = `YTDL Crash`;
                            await interaction.editReply({
                                components: [],
                                embeds: [musicBed],
                                ephemeral: true,
                            });
                            return;
                        }

                        if (gqueue.songs.length == 0) {
                            musicBed.description = `Added ${i.values.length} songs. Playing: ${info.label}`;
                            await interaction.editReply({
                                components: [],
                                embeds: [musicBed],
                                ephemeral: true,
                            });
                            await gqueue.songs.push(
                                new Song(info.label, i.values[0])
                            );
                            await play(gqueue.songs[0]?.url, cguild, cchan);

                            let rest = i.values;
                            rest.shift();

                            for await (const value of rest) {
                                info = urlTable.options.find(
                                    (option) => option.value == value
                                );
                                gqueue.songs.push(new Song(info.label, value));
                            }
                        } else {
                            musicBed.description = `Added ${i.values.length} songs.`;
                            await interaction.editReply({
                                components: [],
                                embeds: [musicBed],
                                ephemeral: true,
                            });

                            if (playnext) {
                                let counter = 0;
                                for await (const value of i.values) {
                                    counter++;
                                    info = urlTable.options.find(
                                        (option) => option.value == value
                                    );
                                    gqueue.songs.splice(
                                        counter,
                                        0,
                                        new Song(info.label, value)
                                    );
                                }
                            } else {
                                for await (const value of i.values) {
                                    info = urlTable.options.find(
                                        (option) => option.value == value
                                    );
                                    gqueue.songs.push(
                                        new Song(info.label, value)
                                    );
                                }
                            }
                        }
                        const connection = Voice.getVoiceConnection(cguild);
                        if (!(connection && gqueue.player)) {
                            await play(gqueue.songs[0]?.url, cguild, cchan);
                        }
                        updatePlaying(gqueue, cguild);
                        return;
                    })
                    .catch(async (err) => {
                        console.log(err);
                        console.log("Collector stopped.");
                        musicBed.description = `No songs selected.`;
                        await interaction.editReply({
                            components: [],
                            embeds: [musicBed],
                            ephemeral: true,
                        });
                    });
                return;
            }
            const connection = Voice.getVoiceConnection(cguild);
            if (!(connection && gqueue.player)) {
                await play(gqueue.songs[0]?.url, cguild, cchan);
            }
            updatePlaying(gqueue, cguild);
            return;
        }
    }

    if (commandName === "addchar") {
        if (options.getMentionable("userId")) {
            log("userId");
        }
        let user = interaction.user.id;
        let addBed = {
            title: "ADD Character",
            description: `Your character add query returned :`,
            color: 7419530,
            timestamp: Date.now(),
            footer: {
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
                text: "powered by SMObot",
            },
            author: {
                name: "ID Manager",
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
            },
            fields: [],
        };
        let queryFull = [];

        if (options.getString("character")) {
            queryFull.push(
                addCharacter(
                    options.getString("character").toLowerCase(),
                    user,
                    addBed
                )
            );
        }
        if (options.getString("character2")) {
            queryFull.push(
                addCharacter(
                    options.getString("character2").toLowerCase(),
                    user,
                    addBed
                )
            );
        }
        if (options.getString("character3")) {
            queryFull.push(
                addCharacter(
                    options.getString("character3").toLowerCase(),
                    user,
                    addBed
                )
            );
        }
        if (options.getString("character4")) {
            queryFull.push(
                addCharacter(
                    options.getString("character4").toLowerCase(),
                    user,
                    addBed
                )
            );
        }
        if (options.getString("character5")) {
            queryFull.push(
                addCharacter(
                    options.getString("character5").toLowerCase(),
                    user,
                    addBed
                )
            );
        }

        await Promise.all(queryFull).then(async function (response) {
            await interaction.reply({
                embeds: [addBed],
                ephemeral: true,
            });
        });
    }

    if (commandName === "removechar") {
        let user = interaction.user.id;
        let endMessage = "";
        if (options.getString("character")) {
            endMessage += await removeCharacter(
                options.getString("character"),
                user
            );
        }
        if (options.getString("character2")) {
            endMessage += await removeCharacter(
                options.getString("character2"),
                user
            );
        }
        if (options.getString("character3")) {
            endMessage += await removeCharacter(
                options.getString("character3"),
                user
            );
        }
        if (options.getString("character4")) {
            endMessage += await removeCharacter(
                options.getString("character4"),
                user
            );
        }
        if (options.getString("character5")) {
            endMessage += await removeCharacter(
                options.getString("character5"),
                user
            );
        }

        await interaction.reply({
            content: endMessage,
            ephemeral: true,
        });
    }

    if (commandName === "update") {
        if (interaction.user.id != "319128664291672085") {
            await interaction.reply({
                content: "NONO",
                ephemeral: true,
            });
            return;
        }

        await interaction.deferReply({
            ephemeral: true,
        });

        let answered = false;

        let updBed = {
            title: "UPDATE Character",
            description: `Successfully updated characters :`,
            color: 7419530,
            timestamp: Date.now(),
            footer: {
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
                text: "powered by SMObot",
            },
            author: {
                name: "ID Manager",
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
            },
            fields: [],
        };

        let chars = await getChars();

        let charsPromise = [];
        let requests = 1;

        if (!chars) {
            await interaction.reply({
                content: "ERROR",
                ephemeral: true,
            });
            return;
        } else {
            for await (const char of chars) {
                if (requests % 30 == 0) {
                    await Promise.all(charsPromise);
                    if (updBed.fields.length > 0) {
                        await interaction.followUp({
                            embeds: [updBed],
                            ephemeral: true,
                        });
                    }
                    updBed.fields = [];
                    answered = true;
                    charsPromise = [];
                    await delay(500);
                }
                charsPromise.push(
                    updateCharacter(char.character, char.discordid, updBed)
                );
                requests++;
            }

            await Promise.all(charsPromise);

            if (updBed.fields == 0) {
                if (!answered) {
                    updBed.description = `${checkmoji} ALL CHARACTERS ARE UP TO DATE ${checkmoji}`;
                    await interaction.followUp({
                        embeds: [updBed],
                        ephemeral: true,
                    });
                }
            } else {
                await interaction.followUp({
                    embeds: [updBed],
                    ephemeral: true,
                });
            }

            return;
        }
    }

    if (commandName === "id") {
        let raidString = "";
        let user = interaction.user.id;
        let classa;
        let chars;
        let charMap = [];
        let pb = false;

        let ePos;
        let eClass;
        let eUser = interaction.user.id;
        let eRaid;
        let eDesc = "Query for";

        if (options.getBoolean("public") == true) {
            pb = true;
        }

        await interaction.deferReply({ ephemeral: !pb });

        if (options.getUser("userid")) {
            user = await options.getUser("userid").id;
        }

        async function publ(isPublic, msg) {
            await interaction.followUp({
                embeds: [msg],
                ephemeral: !isPublic,
            });
        }

        if (options.getString("raid") == "msv") {
            eRaid = "Mogu'shan Vaults";
            eDesc += " Mogu'shan Vaults";
            raidString = "msv-statistic',";
        } else if (options.getString("raid") == "hof") {
            eRaid = "Heart of Fear";
            eDesc += "Heart of Fear";
            raidString = "hof-statistic',";
        } else if (options.getString("raid") == "toes") {
            eRaid = "Terrace of Endless Spring";
            eDesc += "Terrace of Endless Spring";
            raidString = "toes-statistic',";
        }

        if (options.getString("class")) {
            eClass = options.getString("class");
            eDesc += ` as ${
                classes[parseInt(options.getString("class")) - 1][1]
            }`;
            classa = options.getString("class");
        } else {
            classa = null;
        }

        if (options.getSubcommand() == "all") {
            if (options.getString("position") && classa) {
                eDesc += ` for position: ${options
                    .getString("position")
                    .toUpperCase()}`;
                ePos = options.getString("position");
                chars = await getCharsByIdAndClassAndRole(
                    user,
                    options.getString("position"),
                    classa
                );
            } else if (options.getString("position")) {
                chars = await getCharsByIdAndClassOrRole(
                    user,
                    options.getString("position")
                );
                eDesc += ` for position: ${options
                    .getString("position")
                    .toUpperCase()}`;
            } else if (classa) {
                chars = await getCharsByIdAndClassOrRole(user, classa);
            } else {
                chars = await getCharsById(user);
            }

            let idBed = {
                title: "ID Search",
                description: `${eDesc}`,
                color: 7419530,
                author: {
                    name: "ID Manager",
                    icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
                },
                fields: [],
            };

            if (chars.length == 0) {
                if (options.getString("position")) {
                    idBed.fields.push({
                        name: "Pre túto pozíciu nie sú v databáze žiadne postavy",
                        value: ":(",
                    });
                } else {
                    idBed.fields.push({
                        name: "V databáze nie sú žiadne postavy",
                        value: ":(",
                    });
                }
                publ(pb, idBed);
                return;
            } else {
                for await (const char of chars) {
                    charMap.push({
                        name: char.character,
                        ilvl: char.ilvl,
                        classid: char.classid,
                    });
                }
                let idBeds = await getID(
                    charMap,
                    raidString,
                    idBed,
                    options.getBoolean("freeonly")
                );
                console.log("SRACKA");
                console.log(idBeds);
                idBeds.forEach((element) => {
                    publ(pb, element);
                });
                return;
            }
        }

        if (options.getSubcommand() == "character") {
            let idBed = {
                title: "ID Search",
                description: `${eDesc}`,
                color: 7419530,
                author: {
                    name: "ID Manager",
                    icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
                },
                fields: [],
            };

            charMap.push({ name: `${options.getString("character")}` });

            for (let index = 1; index < 10; index++) {
                if (options.getString(`character${index}`)) {
                    charMap.push({
                        name: `${options.getString(`character${index}`)}`,
                    });
                }
            }

            idBed = await getID(charMap, raidString, idBed, false);
            publ(pb, idBed[0]);
            return;
        }

        interaction.editReply(
            `\`\`\`${crossmoji}NIECO SA ZJEBLO${crossmoji}\`\`\``
        );
    }

    if (commandName === "lfm2") {
        if (options.getString("raid").toLowerCase() == "ds") {
            raidName = "Dragon Soul";
        } else if (options.getString("raid").toLowerCase() == "fl") {
            raidName = "Firelands";
        } else if (options.getString("raid").toLowerCase() == "bot") {
            raidName = "Bastion of Twilight";
        } else if (options.getString("raid").toLowerCase() == "bwd") {
            raidName = "Blackwing Descent";
        } else if (options.getString("raid").toLowerCase() == "t4w") {
            raidName = "Throne of the Four Winds";
        }

        if (options.getString("size"))
            raidName = raidName + " " + options.getString("size");

        let raidLeader = interaction.user.id;

        if (options.getUser("leader")) {
            raidLeader = options.getUser("leader");
        }

        const raidBed = {
            title: raidName,
            description: "by <@" + raidLeader + "> ",
            color: 7419530,
            timestamp: Date.now(),
            footer: {
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
                text: "powered by SMObot",
            },
            author: {
                name: "RAID Manager",
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
            },
            fields: [
                {
                    name: "HC :",
                    value: options.getString("hc"),
                    inline: true,
                },
                {
                    name: "Looking for :",
                    value: options.getString("roles"),
                    inline: true,
                },
            ],
        };

        const roomBed = {
            title: "Discords:",
            description:
                "The discords you can send this to:\n Select servers by typing space-separated indexes of servers.\n\u2800\n",
            color: 7419530,
            timestamp: Date.now(),
            footer: {
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
                text: "powered by SMObot",
            },
            image: {
                url: "https://i.ibb.co/Xt2cjdV/400x1-00000000.png",
            },
            fields: [],
        };

        let pole = { name: "Servers: ", value: "\n" };

        const raid = {
            user: raidLeader,
            messages: [],
            embed: raidBed,
            chars: [],
        };

        raidRoomMap.sort(compareNames);

        raidRoomMap.forEach((channel) => {
            pole.value += `\`${raidRoomMap.indexOf(channel)}:\`   **${
                channel.guild.name
            }**\n`;
        });

        roomBed.fields.push(pole);

        console.log(roomBed);

        if (options.getString("day"))
            raidBed.fields.push({
                name: "Day : ",
                value: options.getString("day"),
            });
        raidBed.fields.push({
            name: "Time : ",
            value: options.getString("time"),
        });
        if (options.getString("info"))
            raidBed.fields.push({
                name: "Additional Info: ",
                value: options.getString("info"),
            });

        await interaction.reply({
            content: `\`PREVIEW\``,
            embeds: [raidBed, roomBed],
            ephemeral: true,
        });

        if (collectorMap.has(interaction.user)) {
            if (collectorMap.get(interaction.user)) {
                collectorMap.get(interaction.user).stop();
            }
            collectorMap.delete(interaction.user);
        }

        const filter = (m) => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({
            filter,
            time: 300000,
        });

        collectorMap.set(interaction.user, collector);

        collector.on("end", () => {
            collectorMap.delete(interaction.user);
        });

        collector.on("collect", async (m) => {
            let splitCollected = m.content.split(" ");
            m.delete().catch(console.error);

            if (splitCollected.includes("DELETE")) {
                collector.stop();
                await interaction.followUp({
                    content: "Deleted.",
                    ephemeral: true,
                });
                return;
            }

            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId("raidsign")
                    .setLabel("Sign up")
                    .setStyle("PRIMARY")
            );

            if (splitCollected.includes("ALL")) {
                raidRoomMap.forEach((channel) => {
                    if (
                        raidLeader == "504719213815136276" &&
                        channel.guild.id == "916662678049652738"
                    ) {
                        console.log(raidLeader + "stuff");
                    } else {
                        channel
                            .send({ content: "@everyone", embeds: [raidBed] })
                            .catch(console.error);
                    }
                });
                collector.stop();
                await interaction.followUp({
                    content: "Sent to all.",
                    ephemeral: true,
                });
                return;
            }

            splitCollected.forEach(async (ele) => {
                let raidId;
                if (raidRoomMap[parseInt(ele, 10)]) {
                    collector.stop();
                    if (
                        raidLeader == "504719213815136276" &&
                        raidRoomMap[parseInt(ele, 10)].guild.id ==
                            "916662678049652738"
                    ) {
                        console.log(raidLeader + "stuff");
                    } else {
                        raidId = await raidRoomMap[parseInt(ele, 10)]
                            .send({
                                content: "@everyone",
                                embeds: [raidBed],
                                components: [row],
                            })
                            .catch(console.error);
                        raidRoomId.push(raidId);
                        testBed = raidBed;
                    }
                }
            });
        });
    }

    //HERE
    if (commandName === "raid") {
        let raidLeader = options.getUser("leader");
        let rlMember;
        let raidLeaderId;
        let already = false;
        let raidInfo;

        if (!raidLeader) {
            raidLeader = interaction.user;
            raidLeaderId = interaction.user.id;
            rlMember = interaction.guild.members.cache.get(interaction.user.id);
        } else {
            raidLeaderId = raidLeader.id;
            rlMember = interaction.guild.members.cache.get(raidLeader.id);
        }

        if (options.getSubcommandGroup(false) == "user") {
            let roleId = options.getRole("raid").id;
            let rIndex = allRaids.findIndex((r) => r.raidid == roleId);
            if (rIndex == -1) {
                interaction.reply("NOT A RAID");
                return;
            }

            let uId = options.getUser("user").id;
            let uName = options.getUser("user").username;
            let uMember = interaction.guild.members.cache.get(uId);
            let uClass = options.getString("class");
            let uRole = options.getString("position");

            if (options.getSubcommand() == "add") {
                let raidChar = new Toonie(uId, uName, uClass, uRole);

                if ((await allRaids[rIndex].info.characters.length) >= 10) {
                    interaction.reply("RAID FULL");
                    return;
                }

                allRaids.forEach((raid) => {
                    if (raid.raidid == roleId) {
                        if (
                            raid.info.characters.find((cr) => cr.userId == uId)
                        ) {
                            interaction.reply("ALREADY");
                            already = true;
                            return;
                        } else {
                            raid.info.characters.push(raidChar);
                            raidInfo = JSON.stringify(raid.info);
                            return;
                        }
                    }
                });

                if (already) {
                    return;
                }

                uMember.roles.add(roleId);

                var qs = `UPDATE raids SET info = '${raidInfo}' WHERE raidid = '${roleId}'`;
                await execute(qs);
                let buffer = raidRender(allRaids[rIndex].raidid);

                let room = interaction.guild.channels.cache.get(
                    allRaids[rIndex].info.roomId
                );

                if (allRaids[rIndex].info.messageId != "") {
                    let message = room.messages.cache.get(
                        allRaids[rIndex].info.messageId
                    );
                    message.edit({
                        files: [{ name: "boi.png", attachment: buffer }],
                    });
                }

                await interaction.reply({
                    content: "Added",
                    files: [
                        {
                            name: "boi.png",
                            attachment: buffer,
                            ephemeral: true,
                        },
                    ],
                    ephemeral: true,
                });
                return;
            }

            //USER EDIT
            if (options.getSubcommand() == "edit") {
                let raidChar = new Toonie(uId, uName, uClass, uRole);
                let roleId = options.getRole("raid").id;

                if ((await allRaids[rIndex].info.characters.length) >= 10) {
                    interaction.reply("RAID FULL");
                    return;
                }

                let userIndex = allRaids[rIndex].info.characters.findIndex(
                    (c) => c.userId == uId
                );
                allRaids[rIndex].info.characters.splice(userIndex, 1, raidChar);

                var qs = `UPDATE raids SET info = '${JSON.stringify(
                    allRaids[rIndex].info
                )}' WHERE raidid = '${roleId}'`;
                await execute(qs);

                let buffer = raidRender(roleId);

                if (allRaids[rIndex].info.messageId != "") {
                    let message = room.messages.cache.get(
                        allRaids[rIndex].info.messageId
                    );
                    message.edit({
                        files: [{ name: "boi.png", attachment: buffer }],
                    });
                }
                await interaction.reply({
                    content: "EDITED",
                    files: [
                        {
                            name: "boi.png",
                            attachment: buffer,
                            ephemeral: true,
                        },
                    ],
                    ephemeral: true,
                });
                return;
            }

            if (options.getSubcommand() == "remove") {
                let roleId = options.getRole("raid").id;

                let cIndex = allRaids[rIndex].info.characters.findIndex(
                    (c) => c.userId == uId
                );

                if (cIndex == -1) {
                    interaction.reply({
                        content: "USER IS NOT IN RAID",
                        ephemeral: true,
                    });
                    return;
                }

                let deleted = allRaids[rIndex].info.characters.splice(
                    cIndex,
                    1
                );

                uMember.roles.remove(roleId).catch(console.error);
                let buffer = raidRender(roleId);

                var qs = `UPDATE raids SET info = '${JSON.stringify(
                    allRaids[rIndex].info
                )}' WHERE raidid = '${roleId}'`;
                await execute(qs);

                if (allRaids[rIndex].info.messageId != "") {
                    let message = room.messages.cache.get(
                        allRaids[rIndex].info.messageId
                    );
                    message.edit({
                        files: [{ name: "boi.png", attachment: buffer }],
                    });
                }
                await interaction.reply({
                    content: "USER REMOVED",
                    files: [
                        {
                            name: "boi.png",
                            attachment: buffer,
                            ephemeral: true,
                        },
                    ],
                    ephemeral: true,
                });
                return;
            }
        } else {
            if (options.getSubcommand() == "remove") {
                let role = options.getRole("raid");
                let rIndex = allRaids.findIndex((r) => r.raidid == role.id);

                if (rIndex == -1) {
                    interaction.reply("NOT A RAID");
                    return;
                }

                await interaction.guild.channels.cache
                    .get(allRaids[rIndex].info.roomId)
                    .delete()
                    .catch(console.error);
                allRaids = allRaids.splice(rIndex, 1);

                var qs = `DELETE FROM RAIDS WHERE RAIDID = '${role.id}'`;
                let ex = await execute(qs);
                role.delete().catch(console.error);
                await interaction.reply("DELETED");
                return;
            }

            if (options.getSubcommand() == "promote") {
                let role = options.getRole("raid");
                let raidLeader = options.getUser("leader");
                let rIndex = allRaids.findIndex((r) => r.raidid == role.id);

                if (rIndex == -1) {
                    interaction.reply("NOT A RAID");
                    return;
                }

                let inRaid = allRaids[rIndex].info.characters.findIndex(
                    (c) => c.userId == raidLeader.id
                );

                if (inRaid == -1) {
                    interaction.reply("NOT IN RAID");
                    return;
                }

                let raidObject = {
                    roleId: allRaids[rIndex].info.roleId,
                    leaderId: allRaids[rIndex].info.leaderId,
                    raidName: allRaids[rIndex].info.raidName,
                    timestamp: new Date(allRaids[rIndex].info.timestamp),
                    roomId: allRaids[rIndex].info.roomId,
                    characters: allRaids[rIndex].info.characters,
                };

                if (raidObject.leaderId == raidLeader.id) {
                    interaction.reply("NN");
                    return;
                }

                raidObject.leaderId = raidLeader.id;

                let raidName = raidObject.raidName;
                let raidShort;

                if (raidName == "Dragon Soul") {
                    raidShort = "DS";
                } else if (raidName == "Firelands") {
                    raidShort = "FL";
                } else if (raidName == "Bastion of Twilight") {
                    raidShort = "BOT";
                } else if (raidName == "Blackwing Descent") {
                    raidShort = "BWD";
                } else if (raidName == "Throne of the Four Winds") {
                    raidShort = "T4W";
                }

                let newName = `${
                    raidLeader.username
                }-${raidShort}-${raidObject.timestamp
                    .getDate()
                    .toString()
                    .padStart(2, "0")}/${(raidObject.timestamp.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}-${raidObject.timestamp
                    .getHours()
                    .toString()
                    .padStart(2, "0")}${raidObject.timestamp
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}`;

                role.setName(newName);

                let room = interaction.guild.channels.cache.get(
                    `${raidObject.roomId}`
                );
                room.setName(newName);

                var qs = `UPDATE raids SET info = '${JSON.stringify(
                    raidObject
                )}' WHERE raidid = '${
                    raidObject.roleId
                }' RETURNING raidid,info `;

                let { rows } = await execute(qs);
                rows.forEach((row) => {
                    let editIndex = allRaids.findIndex(
                        (raid) => raid.raidid == row.raidid
                    );
                    allRaids.splice(editIndex, 1, row);
                });

                interaction.reply("RL SET");
                return;
            }

            if (options.getSubcommand() == "show") {
                let role = options.getRole("raid");
                let rIndex = allRaids.findIndex((r) => r.raidid == role.id);

                if (rIndex == -1) {
                    interaction.reply({
                        content: "NOT A RAID",
                        ephemeral: true,
                    });
                    return;
                }

                let buffer = raidRender(role.id);

                await interaction.reply({
                    files: [{ name: "boi.png", attachment: buffer }],
                    ephemeral: true,
                });
            }

            if (options.getSubcommand() == "publish") {
                let role = options.getRole("raid");
                let rIndex = allRaids.findIndex((r) => r.raidid == role.id);

                if (rIndex == -1) {
                    interaction.reply({
                        content: "NOT A RAID",
                        ephemeral: true,
                    });
                    return;
                }

                let room = interaction.guild.channels.cache.get(
                    allRaids[rIndex].info.roomId
                );
                let buffer = raidRender(role.id);

                let message = await room.send({
                    files: [{ name: "boi.png", attachment: buffer }],
                });

                interaction.reply({ content: "PUBLISHED", ephemeral: true });

                allRaids[rIndex].info.messageId = message.id;

                var qs = `UPDATE raids SET info = '${JSON.stringify(
                    allRaids[rIndex].info
                )}' WHERE raidid = '${allRaids[rIndex].raidid}'`;

                await execute(qs);
            }

            //EDIT
            if (options.getSubcommand() == "edit") {
                let role = options.getRole("raid");
                let rIndex = allRaids.findIndex((r) => r.raidid == role.id);
                if (rIndex == -1) {
                    interaction.reply("NOT A RAID");
                    return;
                }
                let day;
                let time;

                let raidObject = {
                    roleId: allRaids[rIndex].info.roleId,
                    leaderId: allRaids[rIndex].info.leaderId,
                    raidName: allRaids[rIndex].info.raidName,
                    timestamp: new Date(allRaids[rIndex].info.timestamp),
                    roomId: allRaids[rIndex].info.roomId,
                    messageId: allRaids[rIndex].info.messageId,
                    characters: allRaids[rIndex].info.characters,
                };

                if (options.getString("day")) {
                    console.log("DAYYY");
                    let stringsToday = ["dnes", "dneska"];
                    let stringsTomorrow = ["zajtra", "zejtra"];

                    day = options.getString("day").toLowerCase();
                    let month = day.toLowerCase().split("-")[1];
                    let dDay = day.toLowerCase().split("-")[0];

                    let thisYear = parseInt(new Date().getFullYear());

                    if (stringsToday.some((strng) => day.includes(strng))) {
                        day = new Date();
                    } else if (stringsTomorrow.some((sd) => day.includes(sd))) {
                        day = new Date();
                        day = day.setDate(day.getDate() + 1);
                        day = new Date(day);
                    } else {
                        day = new Date(`${thisYear}-${month}-${dDay}`);
                    }

                    if (day < new Date()) {
                        day = new Date(`${thisYear + 1}-${month}-${dDay}`);
                    }

                    raidObject.timestamp.setDate(day.getDate());
                    raidObject.timestamp.setMonth(day.getMonth());
                    raidObject.timestamp.setFullYear(day.getFullYear());
                }

                if (options.getString("time")) {
                    let stringsNow = [
                        "ted",
                        "tedka",
                        "tedkom",
                        "now",
                        "teraz",
                        "hned",
                        "hnedka",
                    ];
                    let time = options.getString("time").toLowerCase();
                    if (stringsNow.some((st) => time.includes(st))) {
                        time = new Date();
                    } else {
                        time = new Date(`1970-01-01T${time}`);
                    }
                    raidObject.timestamp.setHours(time.getHours());
                    raidObject.timestamp.setMinutes(time.getMinutes());
                }

                if (
                    raidObject.timestamp instanceof Date &&
                    !isNaN(raidObject.timestamp)
                ) {
                    await interaction.reply(raidObject.timestamp.toString());
                } else {
                    console.log(raidObject.timestamp);
                    console.log(day);
                    console.log(time);
                    await interaction.reply("WRONG TIME/DATE FORMAT");
                    return;
                }

                let raidName = raidObject.raidName;

                if (raidName == "Dragon Soul") {
                    raidShort = "DS";
                } else if (raidName == "Firelands") {
                    raidShort = "FL";
                } else if (raidName == "Bastion of Twilight") {
                    raidShort = "BOT";
                } else if (raidName == "Blackwing Descent") {
                    raidShort = "BWD";
                } else if (raidName == "Throne of the Four Winds") {
                    raidShort = "T4W";
                }

                let topRole = await Math.max.apply(
                    Math,
                    interaction.guild.me.roles.cache.map(function (o) {
                        return o.position;
                    })
                );

                let newName = `${
                    interaction.user.username
                }-${raidShort}-${raidObject.timestamp
                    .getDate()
                    .toString()
                    .padStart(2, "0")}/${(raidObject.timestamp.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}-${raidObject.timestamp
                    .getHours()
                    .toString()
                    .padStart(2, "0")}${raidObject.timestamp
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}`;

                role.setName(newName);

                role.setPosition(topRole - 1);

                let room = interaction.guild.channels.cache.get(
                    `${raidObject.roomId}`
                );
                room.setName(newName);

                var qs = `UPDATE raids SET info = '${JSON.stringify(
                    raidObject
                )}' WHERE raidid = '${
                    raidObject.roleId
                }' RETURNING raidid,info `;

                let { rows } = await execute(qs);
                rows.forEach((row) => {
                    let editIndex = allRaids.findIndex(
                        (raid) => raid.raidid == row.raidid
                    );
                    allRaids.splice(editIndex, 1, row);
                });

                return;
            }

            //END

            if (options.getSubcommand() == "create") {
                if (options.getString("instance").toLowerCase() == "ds") {
                    raidName = "Dragon Soul";
                    raidShort = "DS";
                } else if (
                    options.getString("instance").toLowerCase() == "fl"
                ) {
                    raidName = "Firelands";
                    raidShort = "FL";
                } else if (
                    options.getString("instance").toLowerCase() == "bot"
                ) {
                    raidName = "Bastion of Twilight";
                    raidShort = "BOT";
                } else if (
                    options.getString("instance").toLowerCase() == "bwd"
                ) {
                    raidName = "Blackwing Descent";
                    raidShort = "BWD";
                } else if (
                    options.getString("instance").toLowerCase() == "t4w"
                ) {
                    raidName = "Throne of the Four Winds";
                    raidShort = "T4W";
                }

                let stringsToday = ["dnes", "dneska"];
                let stringsTomorrow = ["zajtra", "zejtra"];
                let stringsNow = [
                    "ted",
                    "tedka",
                    "tedkom",
                    "now",
                    "teraz",
                    "hned",
                    "hnedka",
                ];

                let day = options.getString("day").toLowerCase();
                let month = options
                    .getString("day")
                    .toLowerCase()
                    .split("-")[1];
                let dDay = options.getString("day").toLowerCase().split("-")[0];
                let time = options.getString("time").toLowerCase();
                let timestamp;

                if (stringsToday.some((strng) => day.includes(strng))) {
                    day = new Date();
                } else if (stringsTomorrow.some((sd) => day.includes(sd))) {
                    day = new Date();
                    day = day.setDate(day.getDate() + 1);
                    day = new Date(day);
                } else {
                    let thisYear = parseInt(new Date().getFullYear());
                    day = new Date(`${thisYear}-${month}-${dDay}`);
                    if (day < new Date()) {
                        day = new Date(`${thisYear + 1}-${month}-${dDay}`);
                    }
                }

                if (stringsNow.some((st) => time.includes(st))) {
                    time = new Date();
                } else {
                    time = new Date(`1970-01-01T${time}`);
                }

                timestamp = new Date(
                    day.getFullYear(),
                    day.getMonth(),
                    day.getDate(),
                    time.getHours(),
                    time.getMinutes()
                );

                if (!(timestamp instanceof Date && !isNaN(timestamp))) {
                    await interaction.reply("NO");
                    return;
                }

                let raidObject = {
                    roleId: "",
                    leaderId: "",
                    raidName: `${raidName}`,
                    timestamp: "",
                    roomId: "",
                    messageId: "",
                    characters: [],
                };

                let topRole = await Math.max.apply(
                    Math,
                    interaction.guild.me.roles.cache.map(function (o) {
                        return o.position;
                    })
                );

                let newName = `${raidLeader.username}-${raidShort}-${timestamp
                    .getDate()
                    .toString()
                    .padStart(2, "0")}/${(timestamp.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}-${timestamp
                    .getHours()
                    .toString()
                    .padStart(2, "0")}${timestamp
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}`;

                let role = await interaction.guild.roles.create({
                    name: newName,
                    color: "GOLD",
                    reason: "created for raiding purposes",
                    position: topRole,
                });

                let raidCat = interaction.guild.channels.cache.find(
                    (chan) => chan.name === "SMO-RAID"
                );

                let room = await interaction.guild.channels.create(newName, {
                    type: "GUILD_TEXT",
                    position: 0,
                    parent: raidCat,
                    permissionOverwrites: [
                        {
                            id: testguild.roles.everyone,
                            deny: [Permissions.FLAGS.VIEW_CHANNEL],
                        },
                        {
                            id: role,
                            allow: [Permissions.FLAGS.VIEW_CHANNEL],
                        },
                    ],
                });

                raidObject.roleId = role.id;
                raidObject.roomId = room.id;
                raidObject.leaderId = raidLeaderId;

                rlMember.roles.add(role);

                raidObject.timestamp = timestamp;
                console.log(JSON.stringify(raidObject));

                let uId = raidLeaderId;
                let uName = raidLeader.username;
                let uClass = options.getString("class");
                let uRole = options.getString("position");

                let raidChar = new Toonie(uId, uName, uClass, uRole);

                raidObject.characters.push(raidChar);

                await interaction.reply({
                    content: "RAID CREATED",
                    ephemeral: true,
                });

                var qs = `INSERT INTO raids(raidid,
        info
        ) VALUES ('${role.id}',
        '${JSON.stringify(raidObject)}'
        ) RETURNING raidid,info`;

                let { rows } = await execute(qs);
                rows.forEach((row) => {
                    allRaids.push(row);
                });

                let buffer = raidRender(role.id);

                await interaction.editReply({
                    content: "RAID CREATED",
                    files: [{ name: "boi.png", attachment: buffer }],
                    ephemeral: true,
                });
            }
        }
    }

    if (commandName === "lfm") {
        if (options.getString("raid").toLowerCase() == "toes") {
            raidImage =
                "https://static.wikia.nocookie.net/wowpedia/images/7/7e/Terrace_of_Endless_Spring_loading_screen.jpg";
            raidName = "Terrace of Endless Spring";
        } else if (options.getString("raid").toLowerCase() == "hof") {
            raidImage =
                "https://static.wikia.nocookie.net/wowpedia/images/0/0b/Heart_of_Fear_loading_screen.jpg";
            raidName = "Heart of Fear";
        } else if (options.getString("raid").toLowerCase() == "msv") {
            raidImage =
                "https://static.wikia.nocookie.net/wowpedia/images/9/9a/Mogu%27shan_Vaults_loading_screen.jpg";
            raidName = "Mogu'shan Vaults";
        }

        if (options.getString("size"))
            raidName = raidName + " " + options.getString("size");

        let raidLeader = interaction.user.id;

        if (options.getUser("leader")) {
            raidLeader = options.getUser("leader").id;
        }

        const raidBed = {
            title: raidName,
            description: `by **${bot.users.cache.get(raidLeader).tag}**`,
            color: 7419530,
            timestamp: Date.now(),
            footer: {
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
                text: "powered by SMObot",
            },
            image: {
                url: raidImage,
            },
            author: {
                name: "RAID Manager",
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
            },
            fields: [
                {
                    name: "HC :",
                    value: options.getString("hc"),
                    inline: true,
                },
                {
                    name: "Looking for :",
                    value: options.getString("roles"),
                    inline: true,
                },
            ],
        };

        const raid = {
            description: "BLA",
        };

        raidRoomMap.sort(compareNames);

        let guildMenu = new MessageSelectMenu()
            .setCustomId(`custom-${interaction.user.id}`)
            .setPlaceholder("Nothing selected");

        raidRoomMap.forEach(async (raidRoom) => {
            let gemoji = await emoguild.emojis.cache.find(
                (emoji) =>
                    emoji.name ==
                    raidRoom.guild.name
                        .replace(/[^a-zA-Z ]/g, "")
                        .toUpperCase()
                        .split(" ")[0]
            );
            guildMenu.addOptions({
                label: `${raidRoom.guild.name}\n`,
                value: raidRoom.id,
                emoji: gemoji,
            });
        });

        guildMenu.setMinValues(1).setMaxValues(raidRoomMap.length);

        const linkButton = await new MessageActionRow().addComponents(
            new MessageButton()
                .setLabel("Direct Message")
                .setURL("discord://-/users/" + raidLeader)
                .setStyle("LINK")
        );

        const row = await new MessageActionRow().addComponents(guildMenu);
        const buttons = await new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("ALL")
                .setLabel("Send to all")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId("DELETE")
                .setLabel("Delete")
                .setStyle("DANGER")
        );

        if (options.getString("day"))
            raidBed.fields.push({
                name: "Day : ",
                value: options.getString("day"),
            });
        raidBed.fields.push({
            name: "Time : ",
            value: options.getString("time"),
        });
        if (options.getString("info"))
            raidBed.fields.push({
                name: "Additional Info: ",
                value: options.getString("info"),
            });

        await interaction.reply({
            embeds: [raidBed],
            components: [row, buttons],
            ephemeral: true,
        });

        if (collectorMap.has(interaction.user)) {
            if (collectorMap.get(interaction.user)) {
                collectorMap.get(interaction.user).stop();
            }
            collectorMap.delete(interaction.user);
        }

        const filterInter = (i) => i.user.id === interaction.user.id;
        const collectorInter =
            interaction.channel.createMessageComponentCollector({
                filterInter,
                time: 300000,
            });

        collectorMap.set(interaction.user, collectorInter);

        collectorInter.on("end", () => {
            collectorMap.delete(interaction.user);
        });

        collectorInter.on("collect", async (i) => {
            if (i.customId.includes("DELETE")) {
                collectorInter.stop();
                raid.description = `${checkmoji} DELETED ${checkmoji}`;
                await i.update({
                    embeds: [raid],
                    components: [],
                    ephemeral: true,
                });
                return;
            }

            if (i.customId.includes("ALL")) {
                raidRoomMap.forEach((channel) => {
                    channel
                        .send({
                            content: "@everyone",
                            embeds: [raidBed],
                            components: [linkButton],
                        })
                        .catch(console.error);
                });
                collectorInter.stop();
                raid.description = `${checkmoji} SENT TO ALL ${checkmoji}`;
                await i.update({
                    embeds: [raid],
                    components: [],
                    ephemeral: true,
                });
                return;
            }

            raid.description = `${checkmoji} SENT TO SELECTED CHANNELS ${checkmoji}`;
            collectorInter.stop();
            raidRoomMap
                .filter((channel) => i.values.includes(channel.id))
                .forEach((filteredChan) =>
                    filteredChan.send({
                        content: "@everyone",
                        embeds: [raidBed],
                        components: [linkButton],
                    })
                );
            await i.update({ embeds: [raid], components: [], ephemeral: true });
        });
    }
});

bot.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (!(oldMember.guild.id == testguild.id)) {
        return;
    }
    if (newMember.roles.cache.some((role) => role.name == "SBTESTER")) {
        if (!testerUsers.includes(newMember.user.id)) {
            testerUsers.push(newMember.user.id);
        }
    } else {
        if (testerUsers.includes(newMember.user.id)) {
            testerUsers = testerUsers.filter(
                (uId) => uId !== newMember.user.id
            );
        }
    }
});

bot.on("messageCreate", async (sprava) => {
    if (sprava.content.toLowerCase().includes("smobot je láska")) {
        sprava.react("❤️");
    }

    if (sprava.author.id == "978935848445808650") {
        let cntnt = sprava.content;
        if (cntnt.includes("break ")) {
            let arg = cntnt.split(" ")[1];
        } else if (cntnt.includes("play ")) {
            let arg = cntnt.split("play")[1];
            unholyPlay(arg);
        }
    }

    if (
        sprava.content.toLowerCase().includes(":(") ||
        sprava.content.toLowerCase().includes("<:frowning_face:>") ||
        sprava.content.toLowerCase() == "😦"
    ) {
        let gif = await gifSearch("puppy");
        sprava.channel.send({ files: [gif.images.fixed_height.url] });
    }

    if (sprava.content.toLowerCase() == "🍕") {
        let gif = await gifSearch("food");
        sprava.channel.send({ files: [gif.images.fixed_height.url] });
    }

    if (sprava.content.toLowerCase() == "🦦") {
        let gif = await gifSearch("otter");
        sprava.channel.send({ files: [gif.images.fixed_height.url] });
    }

    if (sprava.content.toLowerCase() == "🦭") {
        let gif = await gifSearch("seal");
        sprava.channel.send({ files: [gif.images.fixed_height.url] });
    }

    if (sprava.content.toLowerCase() == "🦌") {
        let gif = await gifSearch("deer");
        sprava.channel.send({ files: [gif.images.fixed_height.url] });
    }

    if (sprava.content.toLowerCase() == "🐱") {
        let gif = await gifSearch("kitten");
        sprava.channel.send({ files: [gif.images.fixed_height.url] });
    }

    if (sprava.content.toLowerCase().includes("!gibtest")) {
        let msg = await sprava.channel.send("REACT WITH CHECKMARK TO GET ROLE");
        await msg.react("✅").catch(console.error);
        const filter = (reaction) => reaction.emoji.name === "✅";
        let collector = msg.createReactionCollector({ filter, time: 0 });

        collector.on("collect", (reaction, user) => {
            console.log(reaction);
            let mem = reaction.message.guild.members.cache.find(
                (m) => m.id == user.id
            );
            let role = sprava.guild.roles.cache.find(
                (r) => r.id == "981514534575554581"
            );
            mem.roles.add(role);
        });

        collector.on("end", (collected) => {
            console.log(`Collected ${collected.size} items`);
        });
    }

    async function editMessage(min, time, breakBed) {
        console.log(min);
        time = `${min} seconds`;
        breakBed.description = `Break ends in : \`\`\`${time}\`\`\``;
        if (min > 0) {
            console.log("here");
            await messageTime.edit({ embeds: [breakBed] });
        } else {
            console.log("shouldstop");
            breakBed.description = `\`\`\`BREAK ENDED\`\`\``;
            await messageTime.edit({ embeds: [breakBed] });
            messageTime.channel.send("@everyone");
            taskBreak.stop();
        }
    }

    if (sprava.content.includes("!break")) {
        let min = sprava.content.split("!break")[1];
        min = min * 60;
        let time = `${min} seconds`;
        let breakBed = {
            title: "Break",
            description: `Break ends in : \`\`\`${time}\`\`\``,
            color: 7419530,
            timestamp: Date.now(),
            footer: {
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
                text: "powered by SMObot",
            },
            author: {
                name: "Raid Manager",
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
            },
            fields: [],
        };

        var messageTime = await sprava.channel.send({ embeds: [breakBed] });

        var taskBreak = await cron.schedule(
            "*/3 * * * * *",
            async () => {
                min = min - 3;
                time = `${min} minutes`;
                editMessage(min, time, breakBed);
            },
            {
                scheduled: true,
                timezone: "Europe/Bratislava",
            }
        );
    }

    if (sprava.content.includes("!randomdiss")) {
        const dissArray = [
            "https://i.ibb.co/k4Znr8g/DISSHORS.png",
            "https://i.ibb.co/X3ZccLv/DISSJEBO.png",
            "https://i.ibb.co/SQj5yyF/DISSSILK.png",
        ];
        let random = Math.round(Math.random() * 2);
        const dissBed = {
            title: "Diss of the day",
            color: 7419530,
            timestamp: Date.now(),
            footer: {
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
                text: "powered by SMObot",
            },
            image: {
                url: dissArray[random],
            },
            author: {
                name: "DISS Manager",
                icon_url: "https://i.ibb.co/vs7BpgP/ss.png",
            },
        };
        sprava.channel.send({ embeds: [dissBed] });
    }

    if (
        sprava.content.toLowerCase().includes("!kicc") ||
        sprava.content.toLowerCase().includes("!mutt") ||
        sprava.content.toLowerCase().includes("!unmutt")
    ) {
        if (sprava.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            let voicechan = await sprava.member.voice.channel;
            if (voicechan) {
                voicechan.members.forEach((member) => {
                    if (member != sprava.member) {
                        if (sprava.content.toLowerCase().includes("!kicc")) {
                            member.voice.setChannel(null);
                        } else if (
                            sprava.content.toLowerCase().includes("!mutt")
                        ) {
                            member.voice.setMute(true);
                        } else if (
                            sprava.content.toLowerCase().includes("!unmutt")
                        ) {
                            member.voice.setMute(false);
                        }
                    }
                });
            }
        }
    }

    if (sprava.author.id == "726128183329554463") {
        let skap = await sprava.guild.emojis.cache.find(
            (emoji) => emoji.name === "skap"
        );
        sprava.react(skap).catch(console.error);
    }
});

bot.on("voiceStateUpdate", async (oldMember, newMember) => {
    let newUserChannel = bot.channels.cache.get(newMember.channelId);
    let oldUserChannel = bot.channels.cache.get(oldMember.channelId);
    const guildis = oldMember.guild;

    let emo = await guildis.emojis.cache.find((emoji) => emoji.name === "skap");
    console.log("////////////////");
    console.log("GUILD");
    console.log(guildis.name);
    console.log("////////////////");

    const oUser = guildis.members.cache.find((m) => m.id == newMember);
    const nUser = guildis.members.cache.find((m) => m.id == oldMember);

    if (oldUserChannel === undefined && newUserChannel !== null) {
        let roomRole = null;

        if (
            guildis.roles.cache.find(
                (ro) =>
                    ro.name ==
                    "(room)-" +
                        newUserChannel.name.toLowerCase().replace(/\s+/g, "-")
            ) === undefined
        ) {
            guildis.roles
                .create({
                    name:
                        "(room)-" +
                        newUserChannel.name.toLowerCase().replace(/\s+/g, "-"),
                    color: "BLUE",
                    reason: "we needed a role for Super Cool People",
                })
                .then(async (ro) => {
                    roomRole = ro;
                    console.log(ro.name);

                    if (
                        nUser.roles.cache.find(
                            (ro) => ro.name == roomRole.name
                        ) == null
                    ) {
                        console.log("////////////////");
                        console.log(newMember.member.user.username);
                        console.log(newMember.channel.name);
                        console.log("////////////////");
                        nUser.roles.add(ro);

                        if (
                            guildis.channels.cache.find(
                                (r) =>
                                    r.name.toLowerCase() ==
                                        newUserChannel.name
                                            .toLowerCase()
                                            .replace(/\s+/g, "-") &&
                                    r.parent == newUserChannel.parent &&
                                    r.type != newUserChannel.type
                            ) === undefined
                        ) {
                            await guildis.channels
                                .create(newUserChannel.name, {
                                    type: "GUILD_TEXT",
                                    parent: newUserChannel.parent,
                                    permissionOverwrites: [
                                        {
                                            id: ro.id,
                                            allow: [
                                                Permissions.FLAGS.VIEW_CHANNEL,
                                            ],
                                        },
                                        {
                                            id: guildis.roles.everyone,
                                            deny: [
                                                Permissions.FLAGS.VIEW_CHANNEL,
                                            ],
                                        },
                                    ],
                                })
                                .then(async (vois) => {
                                    let joinBed = await channelChange(
                                        nUser,
                                        "has created the channel."
                                    );
                                    joinBed.color = 15844367;
                                    vois.send({ embeds: [joinBed] }).catch(
                                        console.error
                                    );
                                });
                        }
                    }
                });
        } else {
            console.log("////////////////");
            console.log(newMember.member.user.username);
            console.log(newMember.channel.name);
            console.log("////////////////");
            nUser.roles
                .add(
                    guildis.roles.cache.find(
                        (r) =>
                            r.name ==
                            "(room)-" +
                                newUserChannel.name
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")
                    )
                )
                .catch(console.error);
        }
    }

    if (oldUserChannel === undefined && newUserChannel !== undefined) {
        const channellog = guildis.channels.cache.find(
            (c) =>
                c.name.toLowerCase() ==
                    newUserChannel.name.toLowerCase().replace(/\s+/g, "-") &&
                c.parent == newUserChannel.parent &&
                c.type == "GUILD_TEXT"
        );

        if (channellog) {
            if (
                newUserChannel.name.toLowerCase().replace(/\s+/g, "-") ==
                channellog.name.toLowerCase()
            ) {
                let joinBed = await channelChange(
                    nUser,
                    "has joined the channel."
                );
                joinBed.color = 3066993;
                channellog.send({ embeds: [joinBed] }).catch(console.error);
            }
        }
    } else if (newUserChannel === undefined) {
        const channellog = guildis.channels.cache.find(
            (c) =>
                c.name.toLowerCase() ==
                    oldUserChannel.name.toLowerCase().replace(/\s+/g, "-") &&
                c.parent == oldUserChannel.parent &&
                c.type == "GUILD_TEXT"
        );
        if (channellog) {
            let roomRole = guildis.roles.cache.find(
                (r) =>
                    r.name ==
                    "(room)-" +
                        oldUserChannel.name.toLowerCase().replace(/\s+/g, "-")
            );

            if (
                oUser.roles.cache.find((ro) => ro.name == roomRole.name) != null
            ) {
                await oUser.roles.remove(roomRole).catch(console.error);
            }

            if (
                oldUserChannel.name.toLowerCase().replace(/\s+/g, "-") ==
                channellog.name.toLowerCase()
            ) {
                let joinBed = await channelChange(
                    oUser,
                    "has left the channel."
                );
                joinBed.color = 15158332;
                channellog.send({ embeds: [joinBed] }).catch(console.error);

                if (
                    guildis.channels.cache.find(
                        (c) => c.name == oldUserChannel.name
                    ).members.size < 1
                ) {
                    let delChan = guildis.channels.cache.find(
                        (c) =>
                            c.name.toLowerCase() ==
                                oldUserChannel.name
                                    .toLowerCase()
                                    .replace(/\s+/g, "-") &&
                            c.parent == oldUserChannel.parent &&
                            c.type != "GUILD_VOICE"
                    );
                    let chanFetch = await delChan.fetch(true);

                    if (chanFetch) {
                        chanFetch?.delete().catch(console.error);
                    }

                    let roleFetch = await guildis.roles.fetch(roomRole.id, {
                        cache: false,
                        force: true,
                    });

                    if (roleFetch) {
                        console.log(roomRole.id);
                        await roleFetch?.delete().catch(console.error);
                    }
                }
            }
        }
    } else if (newUserChannel.id !== oldUserChannel.id) {
        let oldRoomRole = guildis.roles.cache.find(
            (r) =>
                r.name ==
                "(room)-" +
                    oldUserChannel.name.toLowerCase().replace(/\s+/g, "-")
        );

        if (
            oUser.roles.cache.find((ro) => ro.name == oldRoomRole?.name) != null
        ) {
            await oUser.roles.remove(oldRoomRole).catch(console.error);
        }

        const channellogold = guildis.channels.cache.find(
            (c) =>
                c.name.toLowerCase() ==
                    oldUserChannel.name.toLowerCase().replace(/\s+/g, "-") &&
                c.parent == oldUserChannel.parent &&
                c.type == "GUILD_TEXT"
        );

        if (channellogold) {
            if (
                oldUserChannel.name.toLowerCase().replace(/\s+/g, "-") ==
                channellogold.name.toLowerCase()
            ) {
                let joinBed = await channelChange(
                    oUser,
                    "has left the channel."
                );
                joinBed.color = 15158332;
                channellogold.send({ embeds: [joinBed] }).catch(console.error);
            }

            if (
                guildis.channels.cache.find(
                    (c) => c.name == oldUserChannel.name
                ).members.size < 1
            ) {
                if (oldRoomRole) {
                    console.log(oldRoomRole.name);
                    console.log("bam");
                    oldRoomRole.delete().catch(console.error);
                }
                delay(500).then(() =>
                    guildis.channels.cache
                        .find(
                            (c) =>
                                c.name.toLowerCase() ==
                                    oldUserChannel.name
                                        .toLowerCase()
                                        .replace(/\s+/g, "-") &&
                                c.parent == oldUserChannel.parent &&
                                c.type != "GUILD_VOICE"
                        )
                        .delete()
                        .catch(console.error)
                );
            }
        }

        const channellognew = guildis.channels.cache.find(
            (c) =>
                c.name.toLowerCase() ==
                    newUserChannel.name.toLowerCase().replace(/\s+/g, "-") &&
                c.parent == newUserChannel.parent &&
                c.type == "GUILD_TEXT"
        );

        if (channellognew) {
            if (
                newUserChannel.name.toLowerCase().replace(/\s+/g, "-") ==
                channellognew.name.toLowerCase()
            ) {
                let joinBed = await channelChange(
                    oUser,
                    "has joined the channel."
                );
                joinBed.color = 3066993;
                channellognew.send({ embeds: [joinBed] }).catch(console.error);
            }
        }

        if (
            guildis.roles.cache.find(
                (ro) =>
                    ro.name ==
                    "(room)-" +
                        newUserChannel.name.toLowerCase().replace(/\s+/g, "-")
            ) === undefined
        ) {
            await guildis.roles
                .create({
                    name:
                        "(room)-" +
                        newUserChannel.name.toLowerCase().replace(/\s+/g, "-"),
                    color: "BLUE",
                    reason: "we needed a role for Super Cool People",
                })
                .then(async (ro) => {
                    let roomRole = ro;
                    console.log(ro.name);

                    if (
                        nUser.roles.cache.find(
                            (ro) => ro.name == roomRole.name
                        ) == null
                    ) {
                        nUser.roles.add(
                            guildis.roles.cache.find(
                                (r) =>
                                    r.name ==
                                    "(room)-" +
                                        newUserChannel.name
                                            .toLowerCase()
                                            .replace(/\s+/g, "-")
                            )
                        );

                        if (
                            guildis.channels.cache.find(
                                (r) =>
                                    r.name.toLowerCase() ==
                                        newUserChannel.name
                                            .toLowerCase()
                                            .replace(/\s+/g, "-") &&
                                    r.parent == newUserChannel.parent &&
                                    r.type != newUserChannel.type
                            ) === undefined
                        ) {
                            await guildis.channels
                                .create(newUserChannel.name, {
                                    type: "GUILD_TEXT",
                                    parent: newUserChannel.parent,
                                    permissionOverwrites: [
                                        {
                                            id: ro.id,
                                            allow: [
                                                Permissions.FLAGS.VIEW_CHANNEL,
                                            ],
                                        },
                                        {
                                            id: guildis.roles.everyone,
                                            deny: [
                                                Permissions.FLAGS.VIEW_CHANNEL,
                                            ],
                                        },
                                    ],
                                })
                                .then(async (vois) => {
                                    let joinBed = await channelChange(
                                        nUser,
                                        "has created the channel."
                                    );
                                    joinBed.color = 15844367;
                                    vois.send({ embeds: [joinBed] }).catch(
                                        console.error
                                    );
                                });
                        }
                    }
                });
        } else {
            nUser.roles
                .add(
                    guildis.roles.cache.find(
                        (r) =>
                            r.name ==
                            "(room)-" +
                                newUserChannel.name
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")
                    )
                )
                .catch(console.error);
        }
    }

    let gqueue = await musicQueue.get(oldMember.guild.id);

    if (
        oldMember.member.user.id == bot.user.id &&
        newMember.member.user.id == bot.user.id
    ) {
        if (newUserChannel && oldUserChannel) {
            if (
                oldMember.channel != newMember.channel &&
                oldMember.guild == newMember.guild
            ) {
                let msg = "";
                try {
                    msg = await gqueue.playingMessage?.fetch();
                } catch (error) {
                    console.log(error);
                }

                if (msg) {
                    msg.delete().catch(console.error);
                }
                gqueue.voiceChannel = newMember.channelId;
                gqueue.textChannel = await guildis.channels.cache.find(
                    (channel) =>
                        channel.name.toLowerCase() ==
                            newUserChannel.name
                                .toLowerCase()
                                .replace(/\s+/g, "-") &&
                        channel.parent == newUserChannel.parent &&
                        channel.type == "GUILD_TEXT"
                );
                gqueue.playingMessage = await gqueue.textChannel
                    ?.send({ embeds: gqueue.playingMessage.embeds })
                    .catch(console.error);
            }
        }
    }

    if (
        oldMember.channelId == gqueue?.voiceChannel ||
        newMember.channelId == gqueue?.voiceChannel
    ) {
        let channel = guildis.channels.cache.get(gqueue.voiceChannel);

        if (channel.memberCount > 1) {
            if (gqueue.dctime) {
                clearTimeout(gqueue.dctime);
                gqueue.dctime = "";
            }
        }
        if (channel.members.size == 1) {
            if (channel.members.first().user.id == bot.user.id) {
                try {
                    gqueue.playing = false;
                    gqueue.player.pause();
                    gqueue.playingMessage.delete().catch(console.error);
                } catch (error) {
                    console.log(error);
                }

                updatePlaying(gqueue, guildis.id);

                gqueue.dctime = setTimeout(async () => {
                    try {
                        await gqueue.playingMessage.delete();
                    } catch (error) {
                        console.log(error);
                    }
                    gqueue.playingMessage = "";
                    gqueue.voiceChannel = "";
                    gqueue.textChannel = "";
                    const connection = Voice.getVoiceConnection(cguild);
                    if (connection) {
                        try {
                            connection?.destroy();
                        } catch (error) {
                            console.log(error);
                        }
                    }
                    if (gqueue.player) {
                        try {
                            gqueue.player?.stop();
                            gqueue.player = "";
                        } catch (error) {
                            console.log(error);
                        }
                    }
                }, 2.5 * 60 * 1000);
            }
        }
    }
});

bot.login(process.env.DTOKEN);
