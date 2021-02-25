
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const SyncGroup   = require(`${ROOT}/modules/sync/SyncGroup`);
const SyncChannel = require(`${ROOT}/modules/sync/SyncChannel`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: null
};
exports.conf = conf;

const help = {
    command: 'sync-group',
    name: 'info',
    category: 'Message Synchronization',
    description: 'Show the details about a channel synchronization group',
    usage: 'sync-group info <group-name>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const name = args[0];
    const syncGroups = await SyncGroup.get({name: name});
    
    if (syncGroups.length == 0) {
        message.channel.send(`Could not find a channel synchronization group named '${name}'`);
        return;
    }
    
    const syncGroup = syncGroups[0];
    const syncChannelGetConditions = {'sync_group_id': syncGroup.sync_group_id};
    const syncChannels = await SyncChannel.get(syncChannelGetConditions);
    let responseContent = `Channel synchronization group '${syncGroup.name}' found with ${syncChannels.length} channel(s)`;
    
    if (syncChannels.length > 0) {
        responseContent += '\n';
    }
    
    for (let x = 0; x < syncChannels.length; x++) {
        const syncChannel = syncChannels[x];
        const channel = await syncChannel.getDiscordChannel();
        responseContent += `\n    <#${channel.id}> (${channel.guild.name})`;
    }
    message.channel.send(responseContent);
};
exports.run = run;
