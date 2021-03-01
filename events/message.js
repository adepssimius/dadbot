
// Determine our place in the world
const ROOT = '..';

// Load our classes
const SyncChannel = require(`${ROOT}/modules/sync/SyncChannel`);
//const SyncMessage = require(`${ROOT}/modules/sync/SyncMessage`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

// The MESSAGE event runs anytime a message is received
// Note that due to the binding of client to every event, every event
// goes `client, other, args` when this function is run.

module.exports = async (message) => {
    // Ignore messages from the bot
    if (message.author.bot) return;
    
    client.logger.debug('Incoming Message');
    client.logger.dump(message);
    
    const syncChannel = await SyncChannel.get({id: message.channel.id, unique: true});
    
    // If we find the prefix, attempt to process the command
    if (message.content.startsWith(client.config.prefix)) {
        if (syncChannel != null) {
            message.channel.send('Commands not accepted within a synchronization channel');
        } else {
            client.runCommand(message);
        }
    
    // Otherwise, attempt to send the message to the synchronization group
    } else {
    //    SyncMessage.sync(message);
    }
};
