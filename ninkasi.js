
// Determine our place in the world
const ROOT = '.';

// Verify the node version is 14.0.0 or above
if (Number(process.version.slice(1).split(".")[0]) < 14)
    throw new Error('Node 14.0.0 or above is required. Update Node on your system.');

// Load singletons - which here in index.js is actually initializing them
const client = require(`${ROOT}/modules/Client`);
const knex   = require(`${ROOT}/modules/Database`); // eslint-disable-line no-unused-vars

// We are doing real fancy node 8 async/await stuff here, and to do that we
// need to wrap stuff in an anonymous function. It is annoying but it works.

const init = async () => {
    const fs = require('fs');
    
    // Initialize the database
    await knex.ninkasiDatabaseInit();
    
    // Load commands** into memory
    const commandFiles = fs.readdirSync(`${ROOT}/commands/`);
    
    client.logger.log(`Loading ${commandFiles.length} commands`);
    commandFiles.forEach(commandFile => {
        if (!commandFile.endsWith('.js')) return;
        const commandName = commandFile.replace(/\.[^/.]+$/, '');
        const response = client.loadCommand(commandName);
        if (response) console.log(response);
    });
    
    // Then we load events, which will include our message and ready event.
    const eventFiles = fs.readdirSync(`${ROOT}/events/`);
    client.logger.log(`Loading a total of ${eventFiles.length} events`);
    eventFiles.forEach(file => {
        const eventName = file.split('.')[0];
        client.logger.log(`Loading Event: ${eventName}`);
        const event = require(`./events/${file}`);
        
        // Bind the client to any event, before the existing arguments provided by
        // the discord.js event. This line is awesome by the way. Just saying.
        client.on(eventName, event.bind(null));
    });
    
    // Here we login the client.
    client.login(client.config.token);
    
    // End top-level async/await function.
};

init();
