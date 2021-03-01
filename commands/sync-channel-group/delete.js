
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance         = require(`${ROOT}/modules/alliance/Alliance`);
const SyncChannelGroup = require(`${ROOT}/modules/sync/SyncChannelGroup`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['del'],
    permLevel: 'admin'
};
exports.conf = conf;

const help = {
    command: 'sync-channel-group',
    name: 'delete',
    category: 'Message Synchronization',
    description: 'Channel synchronization group administration command',
    usage: 'sync-channel-group delete <group-name>'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length != 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    // Get the alliance for this guild
    const alliance = Alliance.get({guildId: message.guild.id, unique: true});
    if (alliance == null) {
        message.channel.send(`Discord clan must be in an alliance to create a channel synchronization group`);
        return;
    }
    
    // Grab the name
    const name = args[0];
    const syncChannelGroup = await SyncChannelGroup.get({name: name, allianceId: alliance.id, unique: true});
    
    if (syncChannelGroup == null) {
        message.channel.send(`Could not find a channel synchronization group named '${name}'`);
        return;
    }
    
    try {
        await syncChannelGroup.delete();
        message.channel.send(`Channel synchronization group deleted`);
    } catch (error) {
        client.replyWithErrorAndDM(`Deletion of channel synchronization group failed: ${name}`, message, error);
    }
};
exports.run = run;
