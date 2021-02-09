
// Verify the node version is 14.0.0 or above
if (Number(process.version.slice(1).split(".")[0]) < 14)
    throw new Error('Node 14.0.0 or above is required. Update Node on your system.');

// Import external modules
const Discord = require('discord.js');
const dotenv  = require('dotenv');
const fs      = require('fs');
// const sqlite3 = require('sqlite3');

// Include class modules
const SyncGroup = require('./lib/SyncGroup');

// set up dotenv
dotenv.config();

// get the db going
// let db = new sqlite3.Database('./db/ninkasi.db', (err) => {
//     if (err) {
//         console.error(err.message);
//     }
//
//     console.log('Connected to the dadabase.');
// });

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.login(process.env.TOKEN);

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

//
// Constants
//

const prefix = process.env.PREFIX;

//
// Load singletons
//

const syncGroupManager = require('./lib/SyncGroupManager');

//
// Events Handlers
//

client.on('message', async message => {
    // Ignore messages from the bot
    if (message.author.bot) return;

    console.log('Incoming Message:');
    console.log(message);
    console.log();
    
    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // if (!client.commands.has(command)) return;
        
        if (!client.commands.has(commandName)) return;
        
        const command = client.commands.get(commandName);
        
        if (command.guildOnly && message.channel.type === 'dm') {
            return message.reply('I cannot execute that command inside DMs!');
        }
        
        try {
            command.execute(message, args);
        } catch (error) {
            console.error(error);
            message.reply('there was an error trying to execute that command!');
        }
        
        //message.channel.send('Command not recognized: ' + command);
        
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
