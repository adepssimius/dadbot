
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance       = require(`${ROOT}/modules/data/Alliance`);
const Channel        = require(`${ROOT}/modules/data/Channel`);
const ChannelGroup   = require(`${ROOT}/modules/data/ChannelGroup`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'admin'
};
exports.conf = conf;

const help = {
    command: 'channel-group',
    name: 'join',
    category: 'Channel Group Administration',
    description: 'Join a channel to this channel group',
    usage: `channel-group join <${ChannelGroup.getFieldValidValues('type').join('|')}> <group-name> [<channel>]`,
    minArgs: 2,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    //
    // TODO - Enhance this function so that a channel reference can be given
    // instead of always linking to the channel from which the command was called
    //
    
    // Get the alliance for this guild
    const alliance = await Alliance.get({guildId: message.guild.id, unique: true});
    if (!alliance) {
        message.channel.send(`Discord clan must be in an alliance to be part of a channel groups`);
        return;
    }
    
    let type = args.shift();

    if (!ChannelGroup.getFieldValidValues('type').includes(type)) {
        args.unshift(type);
        type = null;
    }
    
    if (args.length == 0) {
        message.reply(client.usage(help, commandName, actionName));
        return;
    }
    
    const name = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
    const query = {
        name: name,
        allianceId: alliance.id,
        unique: true
    };
    
    if (type) {
        query.type = type;
    }
    
    const channelGroup = await ChannelGroup.get(query);

    if (channelGroup == null) {
        message.channel.send(`Invalid ${type ? `${type} ` : ''}channel group: ${name}`);
        return;
    }
    
    // Create the channel group object
    const channel = new Channel({
        id: message.channel.id,
        type: channelGroup.type,
        allianceId: alliance.id,
        guildId: message.guild.id,
        channelGroupId: channelGroup.id,
        isSyncChannel: (channelGroup.type == 'sync'),
        discordChannel: message.channel
    });
    
    try {
        await channel.create();
        message.channel.send(`Joined channel <#${channel.id}> to channel group: ${channelGroup.name}`);
        
        client.logger.debug('Channel:');
        client.logger.dump(channel);
    } catch (error) {
        if (error instanceof DuplicateError) {
            message.channel.send(error.message);
            return;
        } else {
            client.replyWithErrorAndDM(`Joining channel to channel group failed: ${channelGroup.name}`, message, error);
        }
    }
};
exports.run = run;
