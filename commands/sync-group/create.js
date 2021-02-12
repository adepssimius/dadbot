
// Load our classes
const SyncGroup = require('../../modules/sync/SyncGroup');

// Load singletons
const client = require('../../modules/Client.js');

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'User'
};
exports.conf = conf;

const help = {
    command: 'sync-group',
    name: 'create',
    category: 'Message Synchronization',
    description: 'Create a new channel synchronization group',
    usage: 'sync-command create <group-name>'
};
exports.help = help;

const run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const name = args[0];
    const data = {'name': name};
    
    const syncGroups = await SyncGroup.get(data);
    
    if (syncGroups.length ) {
        message.channel.send(`There is already a channel synchronization group called '${name}'`);
        return;
    }
    
    const syncGroup = SyncGroup.create(data);
    message.channel.send(`Created sync group: ${name}`);
    
    console.log('Sync Group:');
    console.log(syncGroup);
    console.log();
};
exports.run = run;
