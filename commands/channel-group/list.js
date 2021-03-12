
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance     = require(`${ROOT}/modules/data/Alliance`);
const Channel      = require(`${ROOT}/modules/data/Channel`);
const ChannelGroup = require(`${ROOT}/modules/data/ChannelGroup`);

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
    command: 'channel-group',
    name: 'list',
    category: 'Channel Group Administration',
    description: 'List channel groups',
    usage: `channel-group list [<${ChannelGroup.getFieldValidValues('type').join('|')}>]`,
    minArgs: null,
    maxArgs: 1
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    // Get the alliance for this guild
    const alliance = await Alliance.get({guildId: message.guild.id, unique: true});
    if (alliance == null) {
        message.channel.send(`Discord clan must be in an alliance to be part of channel groups`);
        return;
    }
    
    let types;
    
    if (args.length == 0) {
        types = ChannelGroup.getFieldValidValues('type');
    } else {
        const type = args[0];
        
        if (!ChannelGroup.getFieldValidValues('type').includes(type)) {
            message.channel.send(`Invalid channel group type: ${type}`);
            message.reply(client.usage(help, commandName, actionName));
            return;
        }
        
        types = [ type ];
    }
    
    for (let t = 0; t < types.length; t++) {
        let type = types[t];
        const channelGroups = await ChannelGroup.get({allianceId: alliance.id, type: type});
        
        let response = `**__Channel Group Type__:** ${type}\n`;
        response += `Found ${channelGroups.length} channel group`;
        
        if (channelGroups.length != 1) {
            response += 's';
        }
        
        const channelGroupNames = [];
        for (let g = 0; g < channelGroups.length; g++) {
            const channelGroup = channelGroups[g];
            const channelCount = ( await Channel.get({'channelGroupId': channelGroup.id}) ).length;
            channelGroupNames.push(`${channelGroup.name} (${channelCount} channel${channelCount != 1 ? 's' : ''})`);
        }
        
        if (channelGroupNames.length > 0) {
            response += '\n```' + channelGroupNames.join('\n') + '```';
        }
        
        message.channel.send(response);
    }
};
exports.run = run;
