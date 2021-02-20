
// Load our classes
const Activity         = require('../../modules/event/Activity');
const ActivityCategory = require('../../modules/event/ActivityCategory');
const DuplicateError   = require('../../modules/error/DuplicateError');

// Load singletons
const client = require('../../modules/Client.js'); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'User'
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
    const filter = nextMessage => {
        return nextMessage.author.id == message.author.id;
    };
    
    //const collector = message.channel.createMessageCollector(filter, { time: 60000 });
    const collector = message.channel.createMessageCollector(filter);
    const steps = ['name', 'abbreviation', 'category', 'fireteam_size', 'estimated_mins'];
    
    const wipArg = {
        'collector': collector,
        'data': {creator_id: message.author.id},
        'step': steps.shift(),
        'stepsLeft': steps
    };
    
    await message.reply(`What name do you want to give this activity?`);
    
    collector.on('collect', async function(nextMessage, wip = wipArg) {
        switch (wip.step) {
            case 'name':
                wip.data.activity_name = nextMessage.content;
                wip.step = wip.stepsLeft.shift();
                
                await nextMessage.reply(`How do you want to abbreviate this activity?`);
                break;
            
            case 'abbreviation':
                wip.data.activity_abbr = nextMessage.content;
                wip.step = wip.stepsLeft.shift();
                
                await nextMessage.reply(`To which activity category do you want to assign this activity?`);
                break;
                
            case 'category':
                const activityCategories = await ActivityCategory.getByNameOrAbbr({
                    category_name: nextMessage.content,
                    category_abbr: nextMessage.content
                });
                
                if (activityCategories.length == 0) {
                    nextMessage.reply('Unrecognized activity category, please try again!');
                    return;
                } else if (activityCategories.length > 1) {
                    nextMessage.reply('You matched more then one activity category, please try again!');
                    return;
                }
                
                wip.data.category_id = activityCategories[0].category_id;
                wip.step = wip.stepsLeft.shift();
                
                await nextMessage.reply(`What is the size of the fireteam for this activity`);
                break;
                
            case 'fireteam_size':
                wip.data.fireteam_size = nextMessage.content;
                wip.step = wip.stepsLeft.shift();
                
                await nextMessage.reply(`How many minutes do you estimate this activity to take to complete?`);
                break;
                
            case 'estimated_mins':
                wip.data.estimated_mins = nextMessage.content;
                wip.step = wip.stepsLeft.shift();
                break;
        }
        
        if (wip.step == null) {
	        wip.collector.stop();
	            
            try {
                const activity = await Activity.create(wip.data);
                await message.channel.send(`Activity created`);
                
                client.logger.debug('Activity Created:');
                client.logger.dump(activity);
            
            } catch (error) {
                if (error instanceof DuplicateError) {
                    client.replyWithError(error.message, message);
                } else {
                    const label = `${wip.data.activity_name} [${wip.data.activity_abbr}]`;
                    client.replyWithErrorAndDM(`Creation of activity failed: ${label}`, message, error);
                }
            }
        }
    });
    
    //collector.on('end', async function(collected, user, wip = wipArg) {
    //    
    //});
    
    //if (args.length != 1) {
    //    message.reply(`Usage: ${client.config.prefix}${help.usage}`);
    //    return;
    //}
    //
    //const name = args[0];
    //try {
    //    const syncGroup = await SyncGroup.create({name: name});
    //    message.channel.send(`Created sync group: ${name}`);
    //    
    //    client.logger.debug('Sync Group:');
    //    client.logger.dump(syncGroup);
    //} catch (error) {
    //    if (error instanceof DuplicateError) {
    //        message.channel.send(error.message);
    //        return;
    //    } else {
    //        const details = `Error creating synchronization group '${name}'`;
    //        message.channel.send(details);
    //        client.logger.error(details);
    //        client.logger.dump(error);
    //    }
    //}
};
exports.run = run;
