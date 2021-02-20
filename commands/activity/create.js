
// Load our classes
const Activity         = require('../../modules/event/Activity');
const ActivityCategory = require('../../modules/event/ActivityCategory');
const DuplicateError   = require('../../modules/error/DuplicateError');
const EmojiMap         = require('../../modules/EmojiMap.js');

// Load external classes
const Discord = require('discord.js');

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
    const data = {creator_id: message.author.id};
    
    const steps = [
        {
            name: 'activity_name',
            prompt: async (message, nextMessage) => await message.channel.send(`What is the name of this activity?`),
            onCollect: async (message, nextMessage) => {
                data.activity_name = nextMessage.content;
                steps.shift();
            }
        }, {
            name: 'activity_abbr',
            prompt: async (message, nextMessage) => await message.channel.send(`What is the abbreviation for this activity?`),
            onCollect: async (message, nextMessage) => {
                data.activity_abbr = nextMessage.content;
                steps.shift();
            }
        }, {
            name: 'category_id',
            prompt: async (message, nextMessage) => {
                const emojiMap = new Map();
                let options = '';
                
                // Build the emoji -> activity category map
                const activityCategories = await ActivityCategory.get();
                
                for (let x = 0; x < activityCategories.length; x++) {
                    const activityCategory = activityCategories[x];
                    const emoji = EmojiMap.get(activityCategory.category_abbr);
                    emojiMap.set(emoji, activityCategory);
                    options += `${emoji} - ${activityCategory.category_name}\n`; 
                }
                
                // Send thee prompt
                await message.channel.send(`What activity category do you want to assign to this activity? You can choose a reaction or respond via text.`);
                const embed = new Discord.MessageEmbed().addFields({name: 'Activity Categories', value: options.trim()});
                const replyMessage = await message.channel.send(embed);
                
                // Apply the reaction
                for (let emoji of emojiMap.keys()) {
                    replyMessage.react(emoji);
                }
                
                wip.reactionCollector = replyMessage.createReactionCollector(async (reaction, user) => {
                    return user.id == message.author.id && emojiMap.has(reaction.emoji.name);
                });
                
                wip.reactionCollector.on('collect', async (reaction, user) => {
                    const activityCategory = emojiMap.get(reaction.emoji.name);
                    if (activityCategory != null) {
                        await wip.reactionCollector.stop();
                        wip.reactionCollector = null;
                        
                        data.category_id = activityCategory.category_id;
                        steps.shift();
                        
                        // Since we are in a reaction collector, we need to do this manually
                        await steps[0].prompt(message, nextMessage);
                    }
                });
            },
            onCollect: async (message, nextMessage) => {
                const activityCategories = await ActivityCategory.getByNameOrAbbr({
                    category_name: nextMessage.content,
                    category_abbr: nextMessage.content}
                );
                
                if (activityCategories.length == 0) {
                    await message.channel.send(`Activity category not found: ${nextMessage.content}`);
                } else if (activityCategories.length > 1) {
                    await message.channel.send(`Multiple activity categories found: ${nextMessage.content}`);
                } else {
                    wip.reactionCollector.stop();
                    wip.reactionCollector = null;
                    
                    const activityCategory = activityCategories[0];
                    data.category_id = activityCategory.category_id;
                    steps.shift();
                }
            }
        }, {
            name: 'fireteam_size',
            prompt: async (message, nextMessage) => {
                const emojiMap = new Map();
                
                // Build the emoji -> activity category map
                const fireteamSizes = [1,2,3,4,5,6];
                
                const replyMessage = await message.channel.send(`What maximum fireteam size do you want to set for this activity?`);
                for (let x = 0; x < fireteamSizes.length; x++) {
                    const fireteamSize = fireteamSizes[x];
                    const emoji = EmojiMap.get(fireteamSize);
                    emojiMap.set(emoji, fireteamSize);
                    replyMessage.react(emoji);
                }
                
                const emojiFilter = (reaction, user) => {
                    return user.id == message.author.id && emojiMap.has(reaction.emoji.name);
                };
                
                const reactionCollector = await replyMessage.createReactionCollector(emojiFilter);
                wip.reactionCollector = reactionCollector;
                
                reactionCollector.on('collect', async (reaction, user) => {
                    const fireteamSize = emojiMap.get(reaction.emoji.name);
                    if (fireteamSize != null) {
                        wip.reactionCollector.stop();
                        wip.reactionCollector = null;
                        
                        data.fireteam_size = fireteamSize;
                        steps.shift();
                        
                        // Since we are in a reaction collector, we need to do this manually
                        steps[0].prompt(message, nextMessage);
                    }
                });
            },
            onCollect: async (message, nextMessage) => {
                wip.reactionCollector.stop();
                wip.reactionCollector = null;
                
                data.fireteam_size = nextMessage.content;
                steps.shift();
            }
        }, {
            name: 'estimated_mins',
            prompt: async (message, nextMessage) => message.channel.send(`What is the expected direction (in minutes) of this activity?`),
            onCollect: async (message, nextMessage) => {
                data.estimated_mins = nextMessage.content;
                steps.shift();
            }
        }
    ];
    
    // Check if the activity name was given as an argument
    if (args.length > 0) {
        const name = args.join(' ');
        data.activity_name = name;
        steps.shift(); // Skip the name collection step
    }
    
    const wip = {};
    await steps[0].prompt(message);
    
    wip.collector = message.channel.createMessageCollector(nextMessage => {
        return nextMessage.author.id == message.author.id;
    });

    wip.collector.on('collect', async function(nextMessage) { //, wip = wipArg) {
        await steps[0].onCollect(message, nextMessage);
        
        if (steps.length > 0) {
            await steps[0].prompt(message, nextMessage);
        } else {
            wip.collector.stop();
            wip.collector = null;
            	            
            try {
                const activity = await Activity.create(data);
                await message.channel.send(`Activity created`);
                
                client.logger.debug('Activity Created:');
                client.logger.dump(activity);
            
            } catch (error) {
                if (error instanceof DuplicateError) {
                    await client.replyWithError(error.message, message);
                } else {
                    const label = `${data.activity_name} [${data.activity_abbr}]`;
                    await client.replyWithErrorAndDM(`Creation of activity failed: ${label}`, message, error);
                }
            }
        }
    });
};
exports.run = run;
