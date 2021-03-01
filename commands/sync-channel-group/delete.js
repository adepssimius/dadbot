
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const SyncChannelGroup = require(`${ROOT}/modules/sync/SyncChannelGroup`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['del'],
    permLevel: 'admin'
};
exports.conf = conf;

const help = {
    command: 'sync-channel-group',
    name: 'delete',
    category: 'Message Synchronization',
    description: 'Channel synchronization group administration command',
    usage: 'sync-channel-group delete <group-name>'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const name = args[0];
    const syncChannelGroups = await SyncChannelGroup.get({name: name});
    
    if (syncChannelGroups.length == 0) {
        message.channel.send(`Could not find a channel synchronization group named '${name}'`);
        return;
    }
    
    const syncChannelGroup = syncChannelGroups[0];
    
    try {
        await syncChannelGroup.delete();
        message.channel.send(`Channel synchronization group deleted`);
    } catch (error) {
        client.replyWithErrorAndDM(`Deletion of channel synchronization group failed: ${name}`, message, error);
    }
};
exports.run = run;
