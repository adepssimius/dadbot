
// Load singletons
const client = require('../modules/Client.js'); // eslint-disable-line no-unused-vars

module.exports = async () => {
    // Log that the bot is online.
    client.logger.log(`${client.user.tag}, ready to serve ${client.users.cache.size} users in ${client.guilds.cache.size} servers.`, "ready");

    // Make the bot "play the game" which is the help command with default prefix.
    // TODO - Maybe revise this later
    //client.user.setActivity(`${client.settings.get("default").prefix}help`, {type: "PLAYING"});
    client.user.setActivity(`${client.config.prefix}help`, {type: "PLAYING"});
    
    // Load existing sync groups and channels from Disord itself

    //console.log('Showing all guilds');
    //
    //client.guilds.cache.forEach(async guild => {
    //    console.log('Searching discord: ' + guild.nam + ' [' + guild.id + ']');
    //    
    //    guild.channels.cache.forEach(async channel => {
    //        console.log('  -> Searching channel: #' + channel.name + ' [' + channel.id + ']'); 
    //          
    //        if (channel.type == 'text') {
    //            let webhooks = await channel.fetchWebhooks();
    //            
    //            if (webhooks != null & webhooks.size > 0) {
    //                //console.log('Webhooks: size = ' + webhooks.size);
    //                //console.log(webhooks);
    //                
    //                for (let webhook of webhooks.values()) {
    //                    //console.log('  -> Webhook Name = ' + webhook.name);
    //                    //console.log(webhook);
    //                    
    //                    if (webhook.name.startsWith('sync - ')) {
    //                        const syncGroupName = webhook.name.substring(webhook.name.indexOf('-') + 1).trim();
    //                        console.log('Found sync group: ' + syncGroupName);
    //                        
    //                        let syncGroup = syncGroupManager.lookup(syncGroupName);
    //                        
    //                        if (syncGroup == null) {
    //                            syncGroup = new SyncGroup(syncGroupName);
    //                            syncGroupManager.add(syncGroup);
    //                        }
    //                        
    //                        const syncChannel = syncGroupManager.addChannelToGroup(channel, syncGroup);
    //                        syncChannel.setWebhook(webhook);
    //                    }
    //                }
    //                
    //                //console.log();
    //            }
    //        }
    //    });
    //    
    //    console.log();
    //});

};
