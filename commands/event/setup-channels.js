
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance         = require(`${ROOT}/modules/data/Alliance`);
const Activity         = require(`${ROOT}/modules/data/Activity`);
const ActivityCategory = require(`${ROOT}/modules/data/ActivityCategory`);
const Event            = require(`${ROOT}/modules/data/Event`);
const DuplicateError   = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'user'
};
exports.conf = conf;

const help = {
    command: 'event',
    name: 'setup-channels',
    category: 'Event Coordination',
    description: 'Setup channels for a scheduled event (lfg)',
    usage: 'event|lfg setup-channels <event-id>',
    minArgs: 1,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    // Get the alliance for this guild
    const alliance = await Alliance.get({guildId: message.guild.id, unique: true});
    
    // Get the event
    const eventId = args[0];
    const event = await Event.get({id: eventId, unique: true});
    
    if (event.guildId != message.guild.id) {
        message.channel.send(`This command must be executed on the same discord clan where the event was created`);
        return;
    }
    
    if (event.allianceId != alliance.id) {
        message.channel.send(`This command must be executed in the same alliance where the event was created`);
        return;
    }
    
    await event.setupEventChannels(message);
};
exports.run = run;
