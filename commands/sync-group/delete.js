
// Load our classes
const SyncGroup = require('../../modules/sync/SyncGroup');

// Load singletons
const client = require('../../modules/Client.js'); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'User'
};
exports.conf = conf;

const help = {
    command: 'sync-group',
    name: 'delete',
    category: 'Message Synchronization',
    description: 'Sync Channel administration command',
    usage: 'sync-group delete <group-name>'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const name = args[0];
    const syncGroups = await SyncGroup.get({name: name});
    
    if (syncGroups.length == 0) {
        message.channel.send(`Could not find a channel synchronization group named '${name}'`);
        return;
    }
    
    const syncGroup = syncGroups[0];
    
    try {
        await syncGroup.delete();
        message.channel.send(`Channel synchronization group '${name}' deleted`);
    } catch (error) {
        message.channel.send(`Error deleting synchronization group '${name}'`);
        throw `Error deleting synchronization group '${name}' - ${error}`;
    }
};
exports.run = run;
