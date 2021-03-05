
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance         = require(`${ROOT}/modules/alliance/Alliance`);
const SyncChannelGroup = require(`${ROOT}/modules/sync/SyncChannelGroup`);
const SyncChannel      = require(`${ROOT}/modules/sync/SyncChannel`);
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
    command: 'sync-channel',
    name: 'link',
    category: 'Message Syncronization',
    description: 'Link this channel to a synchronization group',
    usage: 'sync-channel link <group-name> [<channel>]',
    minArgs: 1,
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
    if (alliance == null) {
        message.channel.send(`Discord clan must be in an alliance to be part of synchronization channels`);
        return;
    }
    
    // Attempt to retrieve the specified channel synchronization group
    const name = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
    const syncChannelGroup = await SyncChannelGroup.get({name: name, allianceId: alliance.id, unique: true});
    
    if (syncChannelGroup == null) {
        message.channel.send(`Could not find channel synchronization group: ${name}`);
        return;
    }
    
    // Create the synchronization channel object
    const syncChannel = new SyncChannel({
        id: message.channel.id,
        guildId: message.guild.id,
        channelGroupId: syncChannelGroup.id,
        allianceId: alliance.id,
        channel: message.channel
    });
    
    try {
        await syncChannel.create();
        message.channel.send(`Channel linked to synchronization group: ${syncChannelGroup.name}`);
        
        client.logger.debug('Sync Channel:');
        client.logger.dump(syncChannel);
    } catch (error) {
        if (error instanceof DuplicateError) {
            message.channel.send(error.message);
            return;
        } else {
            client.replyWithErrorAndDM(`Linking channel to synchronization group failed: ${syncChannelGroup.name}`, message, error);
        }
    }
};
exports.run = run;
