
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance = require(`${ROOT}/modules/alliance/Alliance`);

// Load external classes
const Discord = require('discord.js');

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
    command: 'alliance',
    name: 'info',
    category: 'Alliance Administration',
    description: 'Show the details about an alliance',
    usage: 'alliance info [<name|alias>]'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    let alliance;
    
    if (args.length > 0) {
        const value = args.join(' ').replace(/^"(.+)"$/g, "$1").replace(/^'(.+)'$/g, "$1");
        const alliances = await Alliance.get({nameOrShortName: {name: value, shortName: value}});
        
        if (alliances.length == 0) {
            message.channel.send(`Could not find alliance: '${value}'`);
            return;
        }
        alliance = alliances[0];
    
    } else {
        const alliances = await Alliance.get({guildId: message.guild.id});
        
        if (alliances.length == 0) {
            message.channel.send(`This clan discord is not in an alliance`);
            return;
        }
        alliance = alliances[0];
    }
    
    const embed = new Discord.MessageEmbed()
        .setTitle('Alliance')
        .addFields(
            { name: 'Name', value: alliance.name },
            { name: 'Short Name', value: alliance.shortName }
        );
    await message.channel.send(embed);
};
exports.run = run;
