
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
    usage: 'activity create <group-name>'
};
exports.help = help;

const run = async (message, args, level) => {
    // Let's put things in context
    const context = {
        create: true,
        activity: new Activity({creator_id: message.author.id})
    };
    
    // Get our property array
    context.properties = Activity.getEditableProperties(context);
    
    // Check if the activity name was given as an argument
    if (args.length > 0) {
        const name = args.join(' ');
        context.activity.activityName = name;
        context.properties.shift(); // Skip the name collection step
    }
    
    await context.properties[0].prompt(message);
    
    context.collector = message.channel.createMessageCollector(nextMessage => {
        return nextMessage.author.id == message.author.id;
    });
    
    context.collector.on('collect', async function(nextMessage) {
        await context.properties[0].collect(message, nextMessage);
        
        if (context.properties.length > 0) {
            await context.properties[0].prompt(message, nextMessage);
        } else {
            context.collector.stop();
            context.collector = null;
            	            
            try {
                await context.activity.create();
                await message.channel.send(`Activity created`);
                
                client.logger.debug('Activity Created:');
                client.logger.dump(context.activity);
            
            } catch (error) {
                if (error instanceof DuplicateError) {
                    await client.replyWithError(error.message, message);
                } else {
                    await client.replyWithErrorAndDM(`Creation of activity failed: ${context.activity.activityName}`, message, error);
                }
            }
        }
    });
};
exports.run = run;
