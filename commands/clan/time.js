
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Guild     = require(`${ROOT}/modules/alliance/Guild`);
const Timestamp = require(`${ROOT}/modules/Timestamp`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: null
};
exports.conf = conf;

const help = {
    command: 'clan',
    name: 'time',
    category: 'Clan Administration',
    description: 'Show the current clan time or that for the given timezone',
    usage: 'clan time',
    minArgs: 1,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    let tz;
    
    if  (args.length > 0) {
        tz = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
        
        if (!Timestamp.timeZoneIsValid(tz)) {
            await message.channel.send(`Invalid time zone: ${tz}`);
            return;
        }
    } else {
        const guilds = await Guild.get({guild_id: message.guild.id});
        if (guilds.length == 0) {
            message.channel.send(`This discord clan is not currently part of an alliance`);
            return;
        }
        const guild = guilds[0];
        tz = guild.timezone;
    }
    
    const timestamp = new Timestamp(Date.now(), tz);
    const response  = timestamp.convert();
    
    message.channel.send(response);
};
exports.run = run;
