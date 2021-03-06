
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance         = require(`${ROOT}/modules/alliance/Alliance`);
const Activity         = require(`${ROOT}/modules/event/Activity`);
const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
const Event            = require(`${ROOT}/modules/event/Event`);
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
    name: 'create',
    category: 'Event Coordination',
    description: 'Create a new scheduled event (lfg)',
    usage: 'event|lfg create [<activity-name|category-name>]',
    minArgs: null,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    // Get the alliance for this guild
    const alliance = await Alliance.get({guildId: message.guild.id, unique: true});
    
    // Let's put things in context
    const context = {
        create: true,
        event: new Event({
            allianceId: (alliance ? alliance.id : null),
            guildId: message.guild.id,
            platform: 'Stadia',
            isPrivate: false,
            autoDelete: false,
            creatorId: message.author.id,
            ownerId: message.author.id
        })
    };
    
    // Get our property array
    context.properties = Event.getEditableProperties(context);
    
    // Check if an activity name/alias was given as an argument
    if (args.length > 0) {
        const value = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
        const activity = await Activity.get({nameOrAlias: true, name: value, alias: value, unique: true});
        
        if (activity) {
            message.channel.send(`Event type found: ${activity.title}`);
            context.event.activity = activity;
            context.properties.shift(); // Skip the category collection step
            context.properties.shift(); // Skip the activity collection step
        
        } else {
            const activityCategory = await ActivityCategory.get({nameOrSymbol: true, name: value, symbol: value, unique: true});
            
            if (activityCategory) {
                message.channel.send(`Event category found: ${activityCategory.title}`);
                context.event.activityCategory = activityCategory;
                context.properties.shift(); // Skip the category collection step
            
            } else {
                message.channel.send(`Could not find activity or category: ${value}`);
                return;
            }
        }
    }
    
    context.eventBuilderMessageCollector = message.channel.createMessageCollector(nextMessage => {
        return nextMessage.author.id == message.author.id;
    });
    
    context.eventBuilderMessageCollector.on('collect', async function(nextMessage) {
        await context.properties[0].collect(message, nextMessage);
        
        // If we have more properties to collect, prompt and continue
        if (context.properties.length > 0) {
            await context.properties[0].prompt(message, nextMessage);
            return;
        }
        
        // Otherwise, stop the create activity message collector
        context.eventBuilderMessageCollector.stop();
    });
    
    context.eventBuilderMessageCollector.on('end', async function(collected) {
        try {
            // Derive a channel name
            const channelName = await context.event.deriveChannelName();
            context.event.channelName = channelName;
            
            await context.event.create();
            context.event.setupEventChannels(message);
            
            await message.channel.send(`Event created`);
            client.logger.debug('Event Created:');
            client.logger.dump(context.event);
        
        } catch (error) {
            if (error instanceof DuplicateError) {
                await client.replyWithError(error.message, message);
            } else {
                await client.replyWithErrorAndDM(`Creation of event failed: ${context.event.name}`, message, error);
            }
        }
    });
    
    // Prompt for the first property to be collected and then let the collector take over
    await context.properties[0].prompt(message);
};
exports.run = run;
