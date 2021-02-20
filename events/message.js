
// Load singletons
const SyncChannel = require('../modules/sync/SyncChannel');
const SyncMessage = require('../modules/sync/SyncMessage');
const client = require('../modules/Client.js'); // eslint-disable-line no-unused-vars

// The MESSAGE event runs anytime a message is received
// Note that due to the binding of client to every event, every event
// goes `client, other, args` when this function is run.

module.exports = async (message) => {
    // Ignore messages from the bot
    if (message.author.bot) return;
    
    client.logger.debug('Incoming Message');
    client.logger.dump(message);

    // If we find the prefix, attempt to process the command
    if (message.content.startsWith(client.config.prefix)) {
        const syncChannels = await SyncChannel.get({channel_id: message.channel.id});
        
        if (syncChannels.length != 0) {
            message.channel.send('Commands not accepted within a synchronization channel');
        } else {
            client.runCommand(message);
        }
    
    // Otherwise, attempt to send the message to the synchronization group
    } else {
        SyncMessage.sync(message);
    }
};
