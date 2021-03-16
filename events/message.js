
// Determine our place in the world
const ROOT = '..';

// Load our classes
const Message = require(`${ROOT}/modules/data/Message`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

// Emitted whenever a message is created.

module.exports = async (discordMessage) => {
    // Ignore messages from the bot
    if (discordMessage.author.bot) return;
    
    client.logger.debug('Incoming Message');
    client.logger.dump(discordMessage);
    
    // Augment the discord message
    //client.augmentDiscordMessage(discordMessage);
    
    // If we find the prefix, attempt to process the command
    if (discordMessage.content.startsWith(client.config.prefix)) {
        //if (channel != null) {
        //    message.channel.send('Commands not accepted within a synchronization channel');
        //} else {
        //    client.runCommand(message);
        //}
        
        client.runCommand(discordMessage);
        return;
    }
    
    // Otherwise attempt to synchronize this message
    Message.sync(discordMessage);
};
