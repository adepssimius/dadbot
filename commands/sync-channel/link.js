
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const SyncGroup      = require(`${ROOT}/modules/sync/SyncGroup`);
const SyncChannel    = require(`${ROOT}/modules/sync/SyncChannel`);
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
    command: 'sync-channel',
    name: 'link',
    category: 'Message Syncronization',
    description: 'Link this channel to a synchronization group',
    usage: 'sync-command link <sync-group> [<channel>]'
};
exports.help = help;

const run = async (message, args, level) => {
    //
    // TODO - Enhance this function so that a channel reference can be given
    // instead of always linking to the channel from which the command was called
    //
    
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const syncGroupName = args[0];
    const syncGroups = await SyncGroup.get({name: syncGroupName});
    
    if (syncGroups.length == 0) {
        message.channel.send(`Could not find a channel synchronization group named '${syncGroupName}'`);
        return;
    }
    
    const syncGroup = syncGroups[0];
    const data = {'syncGroup': syncGroup, 'channel': message.channel};
    
    try {
        const syncChannel = await SyncChannel.create(data);
        message.channel.send(`Channel linked to synchronization group '${syncGroup.name}'`);
        
        client.logger.debug('Sync Channel:');
        client.logger.dump(syncChannel);
    } catch (error) {
        if (error instanceof DuplicateError) {
            message.channel.send(error.message);
            return;
        } else {
            const details = `Error linking channel to synchronization group '${syncGroup.name}'`;
            message.channel.send(details);
            client.logger.error(details);
            client.logger.dump(error);
        }
    }
};
exports.run = run;
