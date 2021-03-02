
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance         = require(`${ROOT}/modules/alliance/Alliance`);
const SyncChannelGroup = require(`${ROOT}/modules/sync/SyncChannelGroup`);
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
    usage: 'sync-channel-group create <group-name>'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    // Get the alliance for this guild
    const alliance = await Alliance.get({guildId: message.guild.id, unique: true});
    if (alliance == null) {
        message.channel.send(`Discord clan must be in an alliance to create a channel synchronization group`);
        return;
    }
    
    // Grab the name
    const name = args[0];
    
    // Create the channel synchronization group object
    const syncChannelGroup = await new SyncChannelGroup({name: name, allianceId: alliance.id});
    
    try {
        syncChannelGroup.create();
        message.channel.send(`Created channel synchronization group: ${name}`);
        
        client.logger.debug('Channel Synchronization Group:');
        client.logger.dump(syncChannelGroup);
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
