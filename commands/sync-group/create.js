
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const SyncGroup      = require(`${ROOT}/modules/sync/SyncGroup`);
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
    command: 'sync-group',
    name: 'create',
    category: 'Message Synchronization',
    description: 'Create a new channel synchronization group',
    usage: 'sync-group create <group-name>'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const name = args[0];
    try {
        const syncGroup = await SyncGroup.create({name: name});
        message.channel.send(`Created sync group: ${name}`);
        
        client.logger.debug('Sync Group:');
        client.logger.dump(syncGroup);
    } catch (error) {
        if (error instanceof DuplicateError) {
            message.channel.send(error.message);
            return;
        } else {
            const details = `Error creating synchronization group '${name}'`;
            message.channel.send(details);
            client.logger.error(details);
            client.logger.dump(error);
        }
    }
};
exports.run = run;
