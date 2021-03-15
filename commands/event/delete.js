
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Event = require(`${ROOT}/modules/data/Event`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['del'],
    permLevel: 'user'
};
exports.conf = conf;

const help = {
    command: 'event',
    name: 'delete',
    category: 'Event Coordination',
    description: 'Create a new scheduled event (lfg)',
    usage: 'event|lfg delete [<event-id>]',
    minArgs: 1,
    maxArgs: 1
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    const ufid = args[0];
    let event = await Event.get({
        ufid: ufid,
        unique: true
    });
    
    if (!event) {
        message.channel.send(`Could not find event: '${ufid}'`);
        return;
    }
    
    try {
        await event.delete();
        message.channel.send(`Event deleted: ${event.ufid}`); // TODO - Make this message better
    } catch (error) {
        client.replyWithErrorAndDM(`Deletion of event failed: ${event.ufid}`, message, error);
    }
};
exports.run = run;
