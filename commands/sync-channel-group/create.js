
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance         = require(`${ROOT}/modules/data/Alliance`);
const ChannelGroup = require(`${ROOT}/modules/data/ChannelGroup`);
const DuplicateError   = require(`${ROOT}/modules/error/DuplicateError`);

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
    command: 'sync-channel-group',
    name: 'create',
    category: 'Message Synchronization',
    description: 'Create a new channel synchronization group',
    usage: 'sync-channel-group create <name>',
    minArgs: 1,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    // Get the alliance for this guild
    const alliance = await Alliance.get({guildId: message.guild.id, unique: true});
    if (alliance == null) {
        message.channel.send(`Discord clan must be in an alliance to create a channel synchronization group`);
        return;
    }
    
    // Grab the name
    const name = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
    
    // Create the channel synchronization group object
    const channelGroup = await new ChannelGroup({name: name, allianceId: alliance.id});
    
    try {
        await channelGroup.create();
        message.channel.send(`Created channel synchronization group: ${name}`);
        
        client.logger.debug('Channel Synchronization Group:');
        client.logger.dump(channelGroup);
    } catch (error) {
        if (error instanceof DuplicateError) {
            message.channel.send(error.message);
            return;
        } else {
            client.replyWithErrorAndDM(`Creation of channel synchronization group failed: ${name}}`, message, error);
        }
    }
};
exports.run = run;
