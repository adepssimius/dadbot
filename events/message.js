
// Determine our place in the world
const ROOT = '..';

// Load our classes
const SyncMessage = require(`${ROOT}/modules/sync/SyncMessage`);

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
    
    // If we find the prefix, attempt to process the command
    if (message.content.startsWith(client.config.prefix)) {
        //if (syncChannel != null) {
        //    message.channel.send('Commands not accepted within a synchronization channel');
        //} else {
        //    client.runCommand(message);
        //}
        
        client.runCommand(message);
        return;
    }
    
    // Otherwise attempt to synchronize this message
    SyncMessage.sync(message);
};
