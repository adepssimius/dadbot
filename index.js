
// Import external modules
const Discord = require('discord.js');
const dotenv  = require('dotenv');
const sqlite3 = require('sqlite3');

// Include class modules
const SyncGroupManager = require('./lib/SyncGroupManager');
const SyncGroup        = require('./lib/SyncGroup');

// Verify the node version is 14.0.0 or above
if (Number(process.version.slice(1).split(".")[0]) < 14)
    throw new Error('Node 14.0.0 or above is required. Update Node on your system.');

// set up dotenv
dotenv.config();

// get the db going
let db = new sqlite3.Database('./db/ninkasi.db', (err) => {
    if (err) {
        console.error(err.message);
    }

    console.log('Connected to the dadabase.');
});

const client = new Discord.Client();
client.login(process.env.BOT_TOKEN);

//
// Constants
//

const bot_id = '807375870574329907';
const prefix = '%';

//
// Global variables
//

let syncGroupManager = new SyncGroupManager();

//
// Events Handlers


client.on('message', async message => {
    // Ignore messages from the bot
    if (message.author.bot) {
        return;
    }
    
    console.log('Incoming Message:');
    console.log(message);
    console.log();
    
    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        if (command === 'ping') {
            message.channel.send('pong');
        
        } else if (command === 'create-group' || command === 'cg') {
            let syncGroup = syncGroupManager.lookup(args[0]);
            
            if (syncGroup == null) {
                let syncGroup = new SyncGroup(args[0]);
                syncGroupManager.add(syncGroup);
			    message.channel.send('Created sync group: ' + args[0]);
                
                console.log('Sync Group:');
                console.log(syncGroup);
                console.log();
            
            } else {
                message.channel.send('Sync group already exists: ' + args[0]);
            
            }
        
        } else if (command === 'add-channel' || command === 'ac') {
            let syncGroup = syncGroupManager.lookup(args[0]);
            
            if (syncGroup == null) {
                message.channel.send('Could not find sync group named: ' + args[0]);
            }
            
            let syncChannel = syncGroup.addChannel(message.channel);
            syncChannel.createWebhook();
            
            message.channel.send('Added channel to sync group: ' + syncGroup.name);
            
            console.log('Sync Channel:');
            console.log(syncChannel);
            console.log();
        
        } else if (command === 'show-group' || command == 'sg') {
            let syncGroup = syncGroupManager.lookup(args[0]);
            
            if (syncGroup == null) {
                message.channel.send('Could not find sync group named: ' + args[0]);
            
            } else {
                message.channel.send("Sync group '" + syncGroup.name + "' found with " + syncGroup.syncChannels.length + ' channel(s)');
            
            }
        
        } else {
            message.channel.send('Command not recognized: ' + command);
         
        }
        
        return;
    }
    
    //
    // Otherwise, attempt to sync the message
    //

    // See if we can find a sync group for this message's channel
    let syncGroup = syncGroupManager.lookup(message.channel);
    
    if (syncGroup != null) {
        console.log('Found sync group:');
        console.log(syncGroup);
        console.log();

        syncGroup.sendMessage(message);
    } else {
        console.log('Could not find sync group for channel');
        console.log();
    }

});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    // Ignore messages from the bot
    if (newMessage.author.bot) {
        return;
    }
    
    // See if we can find a sync group for this message's channel
    let syncGroup = syncGroupManager.lookup(newMessage.channel);
    
    if (syncGroup != null) {
        console.log('Found sync group:');
        console.log(syncGroup);
        console.log();
        
        syncGroup.editMessage(newMessage);
    } else {
        console.log('Could not find sync group for channel');
        console.log();
    }
});

client.on('messageDelete', async message => {
    // Ignore messages from the bot
    if (message.author.bot) {
        return;
    }
    
    // See if we can find a sync group for this message's channel
    let syncGroup = syncGroupManager.lookup(message.channel);
    
    if (syncGroup != null) {
        console.log('Found sync group:');
        console.log(syncGroup);
        console.log();
        
        syncGroup.deleteMessage(message);
    } else {
        console.log('Could not find sync group for channel');
        console.log();
    }
});

client.once('ready', () => {
    console.log('ready');

    //
    // Load existing sync groups and channels from Disord itself
    //
    
    console.log('Showing all guilds');
    
    client.guilds.cache.forEach(async guild => {
        console.log('Searching discord: ' + guild.nam + ' [' + guild.id + ']');
        
        guild.channels.cache.forEach(async channel => {
            console.log('  -> Searching channel: #' + channel.name + ' [' + channel.id + ']'); 
              
            if (channel.type == 'text') {
                let webhooks = await channel.fetchWebhooks();
                
                if (webhooks != null & webhooks.size > 0) {
                    //console.log('Webhooks: size = ' + webhooks.size);
                    //console.log(webhooks);
                    
                    for (let webhook of webhooks.values()) {
                        //console.log('  -> Webhook Name = ' + webhook.name);
                        //console.log(webhook);
                        
                        if (webhook.name.startsWith('sync - ')) {
                            let syncGroupName = webhook.name.substring(webhook.name.indexOf('-') + 1).trim();
                            console.log('Found sync group: ' + syncGroupName);

                            let syncGroup = syncGroupManager.lookup(syncGroupName);
                            
                            if (syncGroup == null) {
                                syncGroup = new SyncGroup(syncGroupName);
                                syncGroupManager.add(syncGroup);
                            }
                            
                            let syncChannel = syncGroup.addChannel(channel);
                            syncChannel.setWebhook(webhook);
                        }
                    }
                    
                    //console.log();
                }
            }
        });
        
        console.log();
    });

});

/*
client.on('message', message => {
    if (message.content == 'test message') {
        message.channel.send('hello world');
    }
});

client.on('message', message => {
    let query = 'SELECT response FROM jokes WHERE call = ?';
    db.get(query, [message], (err, row) => {
        if (row) {
            message.channel.send(row.response);
        }
    });
});

client.on('message', message => {
    if (message.content == 'ninkasi channel id') {
        message.channel.send(message.channel.id);
    }
});

client.on('message', message => {
    if (message.content == 'ninkasi guild id') {
        message.channel.send(message.guild.id);
    }
});

client.on('message', message => {
    console.log(message.content);
    if (message.content.substring(0,4) == 'sync') {
        let syncType = message.content.substring(5);
        db.run('INSERT INTO guilds_channels_types(guild_id,channel_id,sync_name,guild_name,channel_name) VALUES(?,?,?,?,?)', [message.guild.id, message.channel.id, syncType, message.guild.name, message.channel.name], err => {
            if (err) {
                console.error(err);
            }

            message.channel.send('channel synced!');
        })

    }
});

client.on('message', message => {
    if (!message.author.bot) {
        let query = 'SELECT sync_name, channel_id FROM guilds_channels_types WHERE channel_id = ?';
        db.get(query, [message.channel.id], async (err, result) => {
            if (err) {
                console.log(err);
            }

            if (result) {
                query = 'SELECT guild_id, channel_id from guilds_channels_types where sync_name = ? AND channel_id != ?';
                db.each(query, [result.sync_name, result.channel_id], (err, result) => {
                    if (err) {
                        console.error(err);
                    }
                    console.log(result.channel_id);
                    sendMessageToChannel(client, result.channel_id, message);
                });
            }

        });
    }
});

async function sendMessageToChannel(client, channelId, message) {
    let channel = await client.channels.fetch(channelId)
    
    channel.send(message.content);
}
*/
