
// Verify the node version is 14.0.0 or above
if (Number(process.version.slice(1).split(".")[0]) < 14)
    throw new Error('Node 14.0.0 or above is required. Update Node on your system.');

// Load external modules
const Discord = require('discord.js');
const dotenv  = require('dotenv');
const fs      = require('fs');
// const sqlite3 = require('sqlite3');

// Setup dotenv
dotenv.config();

// Load the database connection
const knex = require('./modules/Database.js');

knex.schema.hasTable('sync_group').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('sync_group', function (table) {
            table.string('sync_group_id', 20).notNullable();
            table.primary('sync_group_id');
            
            table.string('name', 32).notNullable();
            table.timestamps();
        }).then(console.log('Created Table: sync_group'));
    }
});

// knex.schema.hasTable('guild').then(function(exists) {
//     if (!exists) {
//         knex.schema.createTable('guild', function (table) {
//             table.string('guild_id', 20).notNullable();
//             table.primary('guild_id');
//
//             table.timestamps();
//         }).then(console.log('Created Table: guild'));
//     }
// });

knex.schema.hasTable('channel').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('channel', function (table) {
            table.string('guild_id', 20).notNullable();
            table.string('channel_id', 20).notNullable();
            table.primary(['guild_id', 'channel_id']);
            
            table.string('sync_group_id', 20).notNullable();
            table.foreign('sync_group_id', 'channel_sync_group_fk')
                .references('sync_group_id')
                .inTable('sync_group');
            
            table.string('webhook_id', 20);
            table.timestamps();
        }).then(console.log('Created Table: channel'));
    }
});

knex.schema.hasTable('message').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('message', function (table) {
            table.string('guild_id', 20).notNullable();
            table.string('channel_id', 20).notNullable();
            table.string('message_id', 20).notNullable();
            table.primary(['guild_id', 'channel_id', 'message_id']);
            
            table.string('sync_group_id', 20).notNullable();
            table.foreign('sync_group_id', 'message_sync_group_fk')
                .references('sync_group_id')
                .inTable('sync_group');
            
            table.string('webhook_id', 20);
            table.string('content', 2000);
            table.timestamps();
            
        }).then(console.log('Created Table: message'));
    }
});

knex.schema.hasTable('message_clone').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('message_clone', function (table) {
            table.string('guild_id', 20).notNullable();
            table.string('channel_id', 20).notNullable();
            table.string('message_id', 20).notNullable();
            table.primary(['guild_id', 'channel_id', 'message_id']);
            
            table.string('sync_group_id', 20).notNullable();
            table.foreign('sync_group_id', 'channel_clone_sync_group_fk')
                .references('sync_group_id')
                .inTable('sync_group');
            
            table.string('orig_guild_id', 20).notNullable();
            table.string('orig_channel_id', 20).notNullable();
            table.string('orig_message_id', 20).notNullable();
            table.foreign(['orig_guild_id', 'orig_channel_id', 'orig_message_id'], 'message_clone_message_fk')
                .references(['guild_id','channel_id','message_id'])
                .inTable('message');
            
            table.timestamps();
        }).then(console.log('Created Table: message_clone'));
    }
});

//return;

// get the db going
// let db = new sqlite3.Database('./db/ninkasi.db', (err) => {
//     if (err) {
//         console.error(err.message);
//     }
//
//     console.log('Connected to the dadabase.');
// });

const client = require('./modules/Client.js');

// We're doing real fancy node 8 async/await stuff here, and to do that
// we need to wrap stuff in an anonymous function. It's annoying but it works.

const init = async () => {

    // Here we load **commands** into memory, as a collection, so they're accessible
    // here and everywhere else.
    
    // TODO - If we wrap this all in an async function, then change to this
    //const commandFiles = await readdir("./commands/");
    const commandFiles = fs.readdirSync('./commands/');
    
    client.logger.log(`Loading ${commandFiles.length} commands`);
    commandFiles.forEach(commandFile => {
        if (!commandFile.endsWith('.js')) return;
        const commandName = commandFile.replace(/\.[^/.]+$/, '');
        const response = client.loadCommand(commandName);
        if (response) console.log(response);
    });
    
    // Then we load events, which will include our message and ready event.
    const eventFiles = fs.readdirSync('./events/');
    client.logger.log(`Loading a total of $eventFiles.length} events.`);
    eventFiles.forEach(file => {
        const eventName = file.split('.')[0];
        client.logger.log(`Loading Event: ${eventName}`);
        const event = require(`./events/${file}`);
        
        // Bind the client to any event, before the existing arguments
        // provided by the discord.js event. 
        // This line is awesome by the way. Just saying.
        client.on(eventName, event.bind(null, client));
    });
    
    // Generate a cache of client permissions for pretty perm names in commands.
    client.levelCache = {};
    // TODO - Add this part
    //for (let i = 0; i < client.config.permLevels.length; i++) {
    //    const thisLevel = client.config.permLevels[i];
    //    client.levelCache[thisLevel.name] = thisLevel.level;
    //}
    
    // Here we login the client.
    client.login(client.config.token);
    
    // End top-level async/await function.
};

init();
