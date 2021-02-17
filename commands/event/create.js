
// Load our classes
const DuplicateError = require('../../modules/error/DuplicateError');

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
    command: 'event',
    name: 'create',
    category: 'Event Coordination',
    description: 'Create a new scheduled event (lfg)',
    usage: 'event|lfg create <group-name>'
};
exports.help = help;

const run = async (message, args, level) => {
    //if (args.length != 1) {
    //    message.reply(`Usage: ${client.config.prefix}${help.usage}`);
    //    return;
    //}
    
    
    
    //const name = args[0];
    //try {
    //    const syncGroup = await SyncGroup.create({name: name});
    //    message.channel.send(`Created sync group: ${name}`);
    //    
    //    client.logger.debug('Sync Group:');
    //    client.logger.dump(syncGroup);
    //} catch (error) {
    //    if (error instanceof DuplicateError) {
    //        message.channel.send(error.message);
    //        return;
    //    } else {
    //        const details = `Error creating synchronization group '${name}'`;
    //        message.channel.send(details);
    //        client.logger.error(details);
    //        client.logger.dump(error);
    //    }
    //}
};
exports.run = run;
