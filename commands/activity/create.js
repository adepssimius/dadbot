
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Activity       = require(`${ROOT}/modules/event/Activity`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'admin'
};
exports.conf = conf;

const help = {
    command: 'activity',
    name: 'create',
    category: 'Activity Administration',
    description: '',
    usage: 'activity create [<name>]',
    minArgs: null,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;

    // Let's put things in context
    const context = {
        create: true,
        activity: new Activity({creatorId: message.author.id})
    };
    
    // Get our property array
    context.properties = Activity.getEditableProperties(context);
    
    // Check if the activity name was given as an argument
    if (args.length > 0) {
        const name = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
        context.activity.name = name;
        context.properties.shift(); // Skip the name collection step
    }
    
    context.activityBuilderMessageCollector = message.channel.createMessageCollector(nextMessage => {
        return nextMessage.author.id == message.author.id;
    });
    
    context.activityBuilderMessageCollector.on('collect', async function(nextMessage) {
        await context.properties[0].collect(message, nextMessage);
        
        // If we have more properties to collect, prompt and continue
        if (context.properties.length > 0) {
            await context.properties[0].prompt(message, nextMessage);
            return;
        }
        
        // Otherwise, stop the create activity message collector
        context.activityBuilderMessageCollector.stop();
    });
    
    context.activityBuilderMessageCollector.on('end', async function(collected) {
        try {
            await context.activity.create();
            await message.channel.send(`Activity created: ${context.activity.title}`);
            
            client.logger.debug('Activity Created:');
            client.logger.dump(context.activity);
        
        } catch (error) {
            if (error instanceof DuplicateError) {
                await client.replyWithError(error.message, message);
            } else {
                await client.replyWithErrorAndDM(`Creation of activity failed: ${context.activity.activityName}`, message, error);
            }
        }
    });
    
    // Prompt for the first property to be collected and then let the collector take over
    await context.properties[0].prompt(message);
};
exports.run = run;
