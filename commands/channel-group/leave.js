
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const ChannelGroup = require(`${ROOT}/modules/data/ChannelGroup`);
const Channel      = require(`${ROOT}/modules/data/Channel`);

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
    name: 'leave',
    category: 'Channel Administration',
    description: `Leave the channel's current channel group`,
    usage: `channel-group leave [<channel>]`,
    minArgs: null,
    maxArgs: 1
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    //
    // TODO - Enhance this function so that a channel reference can be given
    // instead of always linking to the channel from which the command was called
    //
    
    const channel = await Channel.get({id: message.channel.id, unique: true});
    if (!channel) {
        message.channel.send(`This channel is not part of a channel group`);
        return;
    }
    
    const channelGroup = await ChannelGroup.get({id: channel.channelGroupId, unique: true});

    try {
        await channel.delete();
        message.channel.send(`Channel left channel channel group: ${channelGroup.name}`);
    } catch (error) {
        await client.replyWithErrorAndDM(`Leaving channel failed: ${channelGroup.name}`, message, error);
        client.logger.dump(error);
    }
};
exports.run = run;
