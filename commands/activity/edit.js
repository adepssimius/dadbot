
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Activity = require(`${ROOT}/modules/event/Activity`);
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
    usage: 'activity edit <name|alias>'
};
exports.help = help;

const run = async (message, args, level) => { // eslint-disable-line no-unused-vars
    if (args.length == 0) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const value = args.join(' ');
    const activities = await Activity.getByNameOrAlias({activity_name: value, alias: value});
    
    if (activities.length == 0) {
        message.channel.send(`Could not find activity: '${value}'`);
        return;
    }
    
    const activity = activities[0];
    
    // Get things ready for editing
    const attributes = [
        {
            name: 'Name',
            prompt: async (message, nextMessage) => await message.channel.send(`Please enter the activity name.`),
            onCollect: async (message, nextMessage) => {
                activity.activity_name = nextMessage.content;
            }
        //}, {
        //    name: 'Abbreviation',
        //    prompt: async (message, nextMessage) => await message.channel.send(`Please enter the activity abbreviation.`),
        //    onCollect: async (message, nextMessage) => {
        //        activity.activity_abbr = nextMessage.content;
        //    }
        }, {
            name: 'Activity Category',
            prompt: async (message, nextMessage) => await message.channel.send(`Please enter the activity category id.`),
            onCollect: async (message, nextMessage) => {
                activity.category_id = nextMessage.content;
            }
        }, {
            name: 'Fireteam Size',
            prompt: async (message, nextMessage) => await message.channel.send(`Please enter the maximum fireteam size.`),
            onCollect: async (message, nextMessage) => {
                activity.fireteam_size = nextMessage.content;
            }
        }, {
            name: 'Estimated Maximum Duration',
            prompt: async (message, nextMessage) => await message.channel.send(`Please enter the estimated maximum duration in minutes.`),
            onCollect: async (message, nextMessage) => {
                activity.expected_mins = nextMessage.content;
            }
        }
    ];
    
    async function loop() {
        const emojiMap = new Map();
        let options = '';
        
        for (let x = 0; x < attributes.length; x++) {
            const attribute = attributes[x];
            const emoji = EmojiMap.get(x+1);
            emojiMap.set(emoji, attribute);
            options += `${emoji} - ${attribute.name}\n`;
        }
        emojiMap.set(EmojiMap.get(':x:'), {name: 'Stop'});
        
        await message.channel.send('What would you like to change?');
        const embed = new Discord.MessageEmbed().addFields({name: 'Attribute Selection', value: options.trim()});
        const replyMessage = await message.channel.send(embed);
        
        for (let emoji of emojiMap.keys()) {
            replyMessage.react(emoji);
        }
        
        const reactionCollector = replyMessage.createReactionCollector(async (reaction, user) => {
            return user.id == message.author.id && emojiMap.has(reaction.emoji.name);
        });
        
        reactionCollector.on('collect', async (reaction, user) => {
            const attribute = emojiMap.get(reaction.emoji.name);
            
            // See if it is time to stop
            if (attribute.name == 'Stop') {
                message.channel.send('Exiting edit loop');
                return;
            }
            
            // Otherwise prompt and collect more stuff
            await attribute.prompt(message);
            
            const messageCollector = message.channel.createMessageCollector(nextMessage => {
                return nextMessage.author.id == message.author.id;
            });
            
            messageCollector.on('collect', async function(nextMessage) {
                // Do not collect any more messages
                messageCollector.stop();
                
                // Process this one
                await attribute.onCollect(message, nextMessage);
                await activity.update();
                message.channel.send('Activity updated');
                
                // And do it again!
                loop();
            });
        });
    }
    
    loop();
};
exports.run = run;
