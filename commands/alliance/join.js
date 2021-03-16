
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance       = require(`${ROOT}/modules/data/Alliance`);
const Guild          = require(`${ROOT}/modules/data/Guild`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'clan-admin'
};
exports.conf = conf;

const help = {
    command: 'alliance',
    name: 'join',
    category: 'Alliance Administration',
    description: 'Join this clan discord to an alliance',
    usage: 'alliance join <name|alias>',
    minArgs: 1,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    const value = args.join(' ').replace(/^"(.+)"$/g, "$1").replace(/^'(.+)'$/g, "$1");
    const alliances = await Alliance.get({nameOrShortName: true, name: value, shortName: value});
    
    if (alliances.length == 0) {
        message.channel.send(`Cannot find alliance: ${value}`);
        return;
    }
    const alliance = alliances[0];
    
    // See if this guild is already in an alliance
    let guild = await Guild.get({id: message.guild.id, unique: true});
    
    if (guild && guild.allianceId != null) {
        message.channel.send('This clan discord is already part of an alliance');
        return;
    }
    
    // Attempt to create the guild / add it to the alliance
    try {
        if (!guild) {
            const guildData = {
                id: message.guild.id,
                allianceId: alliance.id,
                creatorId: message.author.id
            };
            guild = await new Guild(guildData);
            await guild.create();
        } else {
            guild.allianceId = alliance.id;
            await guild.update();
        }
        message.channel.send(`Joined clan alliance: ${alliance.title}`);
        
        client.logger.debug('Guild:');
        client.logger.dump(guild);
    
    } catch (error) {
        if (error instanceof DuplicateError) {
            client.replyWithError(error.message, message);
        } else {
            client.replyWithErrorAndDM(`Joining of alliance failed: guild id = ${message.guild.id} : alliance = ${alliance.title}`, message, error);
        }
    }
};
exports.run = run;
