
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Activity = require(`${ROOT}/modules/data/Activity`);
const EmojiMap = require(`${ROOT}/modules/EmojiMap`);

// Load external classes
const Discord = require('discord.js');

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
    name: 'edit',
    category: 'Activity Administration',
    description: 'Make changes to an activity',
    usage: 'activity edit <name|alias>',
    minArgs: 1,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    // Let's put things in context
    const context = {create: false};
    
    const value = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
    context.activity = await Activity.get({nameOrAlias: true, name: value, alias: value, unique: true});
    
    if (!context.activity) {
        message.channel.send(`Could not find activity: ${value}`);
        return;
    }
    
    // Get our property array
    context.properties = Activity.getEditableProperties(context);
    
    async function attributeSelectLoop() {
        const emojiMap = new Map();

        // Prepare the activity attribute editing emoji map
        const options = [];
        for (let x = 0; x < context.properties.length; x++) {
            const property = context.properties[x];
            const emoji = EmojiMap.get(x+1);
            emojiMap.set(emoji, property);
            options.push(`${emoji} - ${property.name}`);
        }
        
        const emoji = EmojiMap.get(':x:');
        options.push(`${emoji} - Done editing activity`);
        emojiMap.set(emoji, {name: 'stop'});
        
        // Share the current state of the activity
        message.channel.send(await context.activity.toMessageContent());
        
        // Prompt for an attribute to edit
        await message.channel.send('What would you like to change?');
        const embed = new Discord.MessageEmbed().addFields({name: 'Select an attribute to edit', value: options.join('\n')});
        const replyMessage = await message.channel.send(embed);
        
        for (let emoji of emojiMap.keys()) {
            replyMessage.react(emoji);
        }
        
        // Create the attribute select message and reaction collectors
        context.attributeSelectMessageCollector = message.channel.createMessageCollector(nextMessage => {
            return nextMessage.author.id == message.author.id;
        });
        
        context.attributeSelectReactionCollector = replyMessage.createReactionCollector(async (reaction, user) => {
            return user.id == message.author.id && emojiMap.has(reaction.emoji.name);
        });
        
        // Hook onto the collect event for the attribute select message and reaction collector
        context.attributeSelectMessageCollector.on('collect', async function(nextMessage) {
            // Grab the selected property
            let emoji;
            
            if (nextMessage.content.toLowerCase() == 'x') {
                emoji = EmojiMap.get(':x:');
            } else {
                emoji = EmojiMap.get(nextMessage.content);
            }
            
            // See if we can find the property for this emoji
            context.property = emojiMap.get(emoji);
            
            // Stop both collectors
            context.attributeSelectReactionCollector.stop();
            context.attributeSelectMessageCollector.stop();
        });
        
        context.attributeSelectReactionCollector.on('collect', async (reaction, user) => {
            // Grab the selected property
            context.property = emojiMap.get(reaction.emoji.name);
            
            // Stop both collectors
            context.attributeSelectReactionCollector.stop();
            context.attributeSelectMessageCollector.stop();
        });
        
        // Hook onto the end event for the attribute select message collector
        // We do not also need to hook onto the reaction collector as we will stop them at the same time
        
        context.attributeSelectMessageCollector.on('end', async function(collected) {
            // Check if the selection was invalid
            if (!context.property) {
                message.channel.send(`Invalid selection, please try again`);
                context.attributeSelectMessageCollector.stop();
                attributeSelectLoop();
                return;
            }
            
            // If this is a collectable attribute then setup a message collector and then prompt
            if (context.property.name != 'stop') {
                context.activityEditorMessageCollector = message.channel.createMessageCollector(nextMessage => {
                    return nextMessage.author.id == message.author.id;
                });
                
                context.activityEditorMessageCollector.on('collect', async function(nextMessage) {
                    context.activityEditorMessageCollector.stop();
                    await context.property.collect(message, nextMessage);
                });
                
                context.activityEditorMessageCollector.on('end', async function(collected) {
                    attributeSelectLoop();
                });
                
                // Prompt for collection of property data
                await context.property.prompt(message);
            }
            
            if (context.property.name == 'stop') {
                // TODO - Add in check to see if anything was changed
                await context.activity.update();
                message.channel.send(`Activity updated: ${context.activity.name}`);
                return;
            }
        });
    }
    
    attributeSelectLoop();
};
exports.run = run;
