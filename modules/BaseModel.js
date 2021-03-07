
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars
const knex   = require(`${ROOT}/modules/Database`);

class BaseModel {
    static schema = {
        tableName: null,
        orderBy: 'created_at',
        fields: []
    };
    
    data = {};
	temp = {};
    
    constructor(data) {
        // Iterate over the incoming field data
        for (const name in data) {
            const object = this.schema.objectMap.get(name);
            if (object) {
                this[object.objectName] = data[object];
            }
            
            const field = this.schema.fieldMap.get(name);
            if (field) {
                this[field.objectFieldName] = data[name];
            } else {
                throw new Error(`Unrecognized field - ${name}`);
            }
        }
        
        // Set any default values
        for (let f = 0; f < this.schema.fields.length; f++) {
            const field = this.schema.fields[f];
            
            if (field.default != undefined && this[field.objectFieldName] == null) {
                this[field.objectFieldName] = field.default;
            }
        }
        
        // Check if this is a new object
        if (!this.createdAt && !this.updatedAt) {
            const timestamp = knex.fn.now();
            this.createdAt = timestamp;
            this.updatedAt = timestamp;
        }
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static parseSchema(schema) {
        // Always add these as they are on all tables
        schema.fields.push({ dbFieldName: 'created_at', type: 'datetime', nullable: false });
        schema.fields.push({ dbFieldName: 'updated_at', type: 'datetime', nullable: false });
        
        // Initialize the maps
        schema.fieldMap = new Map();
        schema.objectMap = new Map();
        
        // Add all the fields
        for (let f = 0; f < schema.fields.length; f++) {
            const field = schema.fields[f];
            
            field.objectFieldName = this.snakeToCamel(field.dbFieldName);
            schema.fieldMap.set(field.objectFieldName, field);
            
            // If the database name does not match the object name,
            // add it to the all field map by it's database field name
            if (field.dbFieldName != field.objectFieldName) {
                schema.fieldMap.set(field.dbFieldName, field);
            }
        }
        
        // Add all the objects
        if (!schema.objects) schema.objects = [];
        
        for (let o = 0; o < schema.objects.length; o++) {
            const object = schema.objects[o];
            schema.objectMap.set(object.objectName, object);
        }
        
        // And return the result
        return schema;
    }
    
    static snakeToCamel(str) {
        return str.replace( /([-_][a-z])/g, (group) => group.toUpperCase().replace('_', '') );
    }
    
    static async get(conditions = {}, orderBy = this.schema.orderBy) {
        let parsedConditions = conditions;
        let unique = false;
        
        // Parse the select conditions
        if (typeof parsedConditions == 'object') {
            if (parsedConditions.unique != null) {
                unique = parsedConditions.unique;
                delete parsedConditions.unique;
            }
            
            parsedConditions = this.parseConditions(parsedConditions);
            parsedConditions = this.parseFieldConditions(parsedConditions);
        }
        
        // For debugging purposes, generate the sql
        const sql = knex(this.schema.tableName)
            .where(parsedConditions)
            .orderBy(orderBy)
            .select()
            .toSQL();
        
        client.logger.debug(`Executing SQL: ${sql.sql}`);
        client.logger.debug(`With Bindings: ${sql.bindings}`);
        
        // Execute the select and gather the results
        const rows = await knex(this.schema.tableName)
            .where(parsedConditions)
            .orderBy(orderBy)
            .then(function(rows) {
                return rows;
            });
        
        const objects = [];
        for (let x = 0; x < rows.length; x++) {
            objects.push(new this(rows[x]));
        }
        
        // Handle this extra carefully if a unique result was expected
        if (unique) {
            if (objects.length > 1) {
                throw new Error(`Found ${objects.length} records from ${this.schema.tableName} when only one was expected`);
            }
            return ( objects.length == 0 ? null : objects[0] );
        }
        
        // Otherwise just return the array of objects
        return objects;
    }
    
    static parseConditions(conditions) {
        return conditions;
    }
    
    static parseFieldConditions(conditions) {
        if (typeof conditions != 'object') {
            return conditions;
        }
        
        const parsedConditions = {};
        
        for (const objectFieldName in conditions) {
            const field = this.schema.fieldMap.get(objectFieldName);
            
            if (!field) {
                throw new Error(`Unrecognized field - ${field.objectFieldName}`);
            }
            
            parsedConditions[field.dbFieldName] = conditions[field.objectFieldName];
        }
        
        return parsedConditions;
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        //const tableName = this.tableName;
        
        // For debugging purposes, generate the sql
        const sql = knex(this.schema.tableName)
            .insert(this.data)
            .toSQL();
        
        client.logger.debug(`Executing SQL: ${sql.sql}`);
        client.logger.debug(`With Bindings: ${sql.bindings}`);
        
        // Execute the insert
        return await knex(this.schema.tableName)
            .insert(this.data)
            .then(function(result) {
                return result;
            });
    }
    
    async update(condition = {id: this.id}) {
        // Update the timestamp
        this.updatedAt = knex.fn.now();
        
        // For debugging purposes, generate the sql
        const sql = knex(this.schema.tableName)
            .where(condition)
            .update(this.data)
            .toSQL();
        
        client.logger.debug(`Executing SQL: ${sql.sql}`);
        client.logger.debug(`With Bindings: ${sql.bindings}`);
        
        const rowsChanged = await knex(this.schema.tableName)
            .where(condition)
            .update(this.data)
            .then(result => {
                return result;
            });
        
        if (rowsChanged == 0) {
            throw new Error('Update did not change any records!');
        } else if (rowsChanged > 1) {
            throw new Error('Update changed more then one record!');
        }
        
        return rowsChanged;
    }
    
    async delete(condition = {id: this.id}) {
        // For debugging purposes, generate the sql
        const sql = knex(this.schema.tableName)
            .where(condition)
            .delete()
            .toSQL();
        
        client.logger.debug(`Executing SQL: ${sql.sql}`);
        client.logger.debug(`With Bindings: ${sql.bindings}`);
        
        return await knex(this.schema.tableName)
            .where(condition)
            .delete()
            .then(result => {
                return result;
            });
    }

    validateFieldName(fieldName) {
        if (!this.hasFieldName(fieldName)) {
            throw new RangeError(`Column ${this.schema.tableName}.${fieldName} does exist`);
        }
        return true;
    }
    
    hasFieldName(fieldName) {
        return this.constructor.schema.fieldMap.has(fieldName);
    }
    
    // ************ //
    // * Getters  * //
    // ************ //
    
    get schema() {
        return this.constructor.schema;
    }
    
    get id() {
        this.validateFieldName('id');
        return this.data.id;
    }
    
    //
    // Object property fields
    //
    
    get alias() {
        this.validateFieldName('alias');
        return this.data.alias;
    }
    
    get autoDelete() {
        this.validateFieldName('auto_delete');
        return this.data.auto_delete;
    }
    
    get channelName() {
        this.validateFieldName('channel_name');
        return this.data.channel_name;
    }
    
    get clanName() {
        this.validateFieldName('clan_name');
        return this.data.clan_name;
    }
    
    get clanShortName() {
        this.validateFieldName('clan_short_name');
        return this.data.clan_short_name;
    }
    
    get clanBungieNum() {
        this.validateFieldName('clan_bungie_num');
        return this.data.clan_bungie_num;
    }
    
    get commandChannelType() {
        this.validateFieldName('command_channel_type');
        return this.data.command_channel_type;
    }
    
    get content() {
        this.validateFieldName('content');
        return this.data.content;
    }
    
    get description() {
        this.validateFieldName('description');
        return this.data.description;
    }
    
    get estMaxDuration() {
        this.validateFieldName('est_max_duration');
        return this.data.est_max_duration;
    }
    
    get fireteamSize() {
        this.validateFieldName('fireteam_size');
        return this.data.fireteam_size;
    }
    
    get isCommandChannel() {
        this.validateFieldName('is_command_channel');
        return this.data.is_command_channel;
    }
    
    get isEventChannel() {
        this.validateFieldName('is_event_channel');
        return this.data.is_event_channel;
    }
    
    get isPrimary() {
        this.validateFieldName('is_primary');
        return this.data.is_primary;
    }
    
    get isPrivate() {
        this.validateFieldName('is_private');
        return this.data.is_private;
    }
    
    get isSyncChannel() {
        this.validateFieldName('is_sync_channel');
        return this.data.is_sync_channel;
    }
    
    get name() {
        this.validateFieldName('name');
        return this.data.name;
    }
    
    get ownerId() {
        this.validateFieldName('owner_id');
        return this.data.owner_id;
    }
    
    get platform() {
        this.validateFieldName('platform');
        return this.data.platform;
    }
    
    get privateEventDefault() {
        this.validateFieldName('private_event_default');
        return this.data.private_event_default;
    }
    
    get startTime() {
        this.validateFieldName('start_time');
        return this.data.start_time;
    }
    
    get shortName() {
        this.validateFieldName('short_name');
        return this.data.short_name;
    }
    
    get symbol() {
        this.validateFieldName('symbol');
        return this.data.symbol;
    }
    
    get timezone() {
        this.validateFieldName('timezone');
        return this.data.timezone;
    }
    
    get type() {
        this.validateFieldName('type');
        return this.data.type;
    }
    
    get username() {
        this.validateFieldName('username');
        return this.data.username;
    }
    
    get webhookId() {
        this.validateFieldName('webhook_id');
        return this.data.webhook_id;
    }
    
    get webhookUrl() {
        this.validateFieldName('webhook_url');
        return this.data.webhook_url;
    }
    
    //
    // Creation and update datetime fields
    // These are always present so no field validation is required
    //
    
    get createdAt() {
        return this.data.created_at;
    }
    
    get updatedAt() {
        return this.data.updated_at;
    }
    
    //
    // Object ID fields and corresponding data object retrieval from temp storage
    //
    
    // Activity
    get activityId() {
        this.validateFieldName('activity_id');
        return this.data.activity_id;
    }
    
    get activity() {
        this.validateFieldName('activity_id');
        return this.temp.activity;
    }
    
    // Activity Category
    get activityCategoryId() {
        this.validateFieldName('activity_category_id');
        return this.data.activity_category_id;
    }
    
    get activityCategory() {
        this.validateFieldName('activity_category_id');
        return this.temp.activityCategory;
    }
    
    // Alliance
    get allianceId() {
        this.validateFieldName('alliance_id');
        return this.data.alliance_id;
    }
    
    get alliance() {
        this.validateFieldName('alliance_id');
        return this.temp.alliance;
    }
    
    // Channel
    get channelId() {
        this.validateFieldName('channel_id');
        return this.data.channel_id;
    }
    
    get channel() {
        this.validateFieldName('channel_id');
        return this.temp.channel;
    }
    
    // Channel Group
    get channelGroupId() {
        this.validateFieldName('channel_group_id');
        return this.data.channel_group_id;
    }
    
    get channelGroup() {
        this.validateFieldName('channel_group_id');
        return this.temp.channelGroup;
    }
    
    // Creator
    get creatorId() {
        this.validateFieldName('creator_id');
        return this.data.creator_id;
    }
    
    get creator() {
        this.validateFieldName('creator_id');
        return this.temp.creator;
    }
    
    // Event
    get eventId() {
        this.validateFieldName('event_id');
        return this.data.event_id;
    }
    
    get event() {
        this.validateFieldName('event_id');
        return this.temp.event;
    }
    
    // Guardian
    get guardianId() {
        this.validateFieldName('guardian_id');
        return this.data.guardian_id;
    }
    
    get guardian() {
        this.validateFieldName('guardian_id');
        return this.temp.guardian;
    }
    
    // Guild
    get guildId() {
        this.validateFieldName('guild_id');
        return this.data.guild_id;
    }
    
    get guild() {
        this.validateFieldName('guild_id');
        return this.temp.guild;
    }
    
    // Joined from Channel
    get joinedFromChannelId() {
        this.validateFieldName('joined_from_channel_id');
        return this.data.joined_from_channel_id;
    }
    
    get joinedFromChannel() {
        this.validateFieldName('joined_from_channel_id');
        return this.temp.joined_from_channel;
    }
    
    // Joined from Guild
    get joinedFromGuildId() {
        this.validateFieldName('joined_from_guild_id');
        return this.data.joined_from_guild_id;
    }
    
    get joinedFromGuild() {
        this.validateFieldName('joined_from_guild_id');
        return this.temp.joined_from_guild;
    }
    
    // Original Channel
    get origChannelId() {
        this.validateFieldName('orig_channel_id');
        return this.data.orig_channel_id;
    }
    
    get origChannel() {
        this.validateFieldName('orig_channel_id');
        return this.temp.orig_channel;
    }
    
    // Original Guild
    get origGuildId() {
        this.validateFieldName('orig_guild_id');
        return this.data.orig_guild_id;
    }
    
    get origGuild() {
        this.validateFieldName('orig_guild_id');
        return this.temp.orig_guild;
    }
    
    // Original Message
    get origMessageId() {
        this.validateFieldName('orig_message_id');
        return this.data.orig_message_id;
    }
    
    get origMessage() {
        this.validateFieldName('orig_message_id');
        return this.temp.orig_message;
    }
    
    // Owner
    get ownerId() {
        this.validateFieldName('owner_id');
        return this.data.owner_id;
    }
    
    get owner() {
        this.validateFieldName('owner_id');
        return this.temp.owner;
    }
    
    // Updater
    get updaterId() {
        this.validateFieldName('updater_id');
        return this.data.updater_id;
    }
    
    get updater() {
        this.validateFieldName('updater_id');
        return this.temp.updater;
    }
    
    // *********** //
    // * Setters * //
    // ********** //
    
    set id(value) {
        this.validateFieldName('id');
        this.data.id = value;
    }
    
    //
    // Object property fields
    //
    
    set alias(value) {
        this.validateFieldName('alias');
        this.data.alias = ( value ? value.toUpperCase() : null );
    }
    
    set autoDelete(value) {
        this.validateFieldName('auto_delete');
        this.data.auto_delete = value;
    }
    
    set channelName(value) {
        this.validateFieldName('channel_name');
        this.data.channel_name = value;
    }
    
    set clanName(value) {
        this.validateFieldName('clan_name');
        this.data.clan_name = value;
    }
    
    set clanShortName(value) {
        this.validateFieldName('clan_short_name');
        this.data.clan_short_name = ( value ? value.toUpperCase() : value );
    }
    
    set clanBungieNum(value) {
        this.validateFieldName('clan_bungie_num');
        this.data.clan_bungie_num = value;
    }
    
    set commandChannelType(value) {
        this.validateFieldName('command_channel_type');
        this.data.command_channel_type = ( value ? value.toUpperCase() : null );
    }
    
    set content(value) {
        this.validateFieldName('content');
        this.data.content = value;
    }
    
    set description(value) {
        this.validateFieldName('description');
        this.data.description = value;
    }
    
    set estMaxDuration(value) {
        this.validateFieldName('est_max_duration');
        this.data.est_max_duration = value;
    }
    
    set fireteamSize(value) {
        this.validateFieldName('fireteam_size');
        this.data.fireteam_size = value;
    }
    
    set isClonedMessage(value) {
        this.validateFieldName('is_cloned_message');
        this.data.is_cloned_message = value;
    }
    
    set isCommandChannel(value) {
        this.validateFieldName('is_command_channel');
        this.data.is_command_channel = value;
    }
    
    set isEventChannel(value) {
        this.validateFieldName('is_event_channel');
        this.data.is_event_channel = value;
    }
    
    set isPrimary(value) {
        this.validateFieldName('is_primary');
        this.data.is_primary = value;
    }
    
    set isPrivate(value) {
        this.validateFieldName('is_private');
        this.data.is_private = value;
    }
    
    set isReactionMessage(value) {
        this.validateFieldName('is_reaction_message');
        this.data.is_reaction_message = value;
    }
    
    set isSyncChannel(value) {
        this.validateFieldName('is_sync_channel');
        this.data.is_sync_channel = value;
    }
    
    set isSyncedMessage(value) {
        this.validateFieldName('is_synced_message');
        this.data.is_synced_message = value;
    }
    
    set joinedFromChannelId(value) {
        this.validateFieldName('joined_from_channel_id');
        this.data.joined_from_channel_id = value;
    }
    
    set joinedFromGuildId(value) {
        this.validateFieldName('joined_from_guild_id');
        this.data.joined_from_guild_id = value;
    }
    
    set name(value) {
        this.validateFieldName('name');
        this.data.name = value;
    }
    
    set platform(value) {
        this.validateFieldName('platform');
        this.data.platform = value;
    }
    
    set privateEventDefault(value) {
        this.validateFieldName('private_event_default');
        this.data.private_event_default = value;
    }
    
    set reactionMessageType(value) {
        this.validateFieldName('reaction_message_type');
        this.data.reaction_message_type = ( value ? value.toUpperCase() : null );
    }
    
    set shortName(value) {
        this.validateFieldName('short_name');
        this.data.short_name = ( value ? value.toUpperCase() : null );
    }
    
    set startTime(value) {
        this.validateFieldName('start_time');
        this.data.start_time = value;
    }
    
    set symbol(value) {
        this.validateFieldName('symbol');
        this.data.symbol = ( value ? value.toUpperCase() : null );
    }
    
    set timezone(value) {
        this.validateFieldName('timezone');
        this.data.timezone = value;
    }
    
    set type(value) {
        this.validateFieldName('type');
        this.data.type = ( value ? value.toUpperCase() : null );
    }
    
    set username(value) {
        this.validateFieldName('username');
        this.data.username = value;
    }
    
    set webhookId(value) {
        this.validateFieldName('webhook_id');
        this.data.webhook_id = value;
    }
    
    set webhookUrl(value) {
        this.validateFieldName('webhook_url');
        this.data.webhook_url = value;
    }
    
    //
    // Creation and update datetime fields
    // These are always present so no field validation is required
    //
    
    set createdAt(value) {
        if (this.data.created_at != null) {
            throw new Error('Cowardly refusing to change createdAt!');
        }
        this.data.created_at = value;
    }
    
    set updatedAt(value) {
        this.data.updated_at = value;
    }
    
    //
    // Object ID fields and correspondingdata object storage to temp storage
    //
    
    // Activity
    set activityId(value) {
        this.validateFieldName('activity_id');
        this.data.activity_id = value;
    }
    
    set activity(activity) {
        this.validateFieldName('activity_id');
        this.temp.activity = activity;
        
        if (this.temp.activity) {
            if (this.hasFieldName('activity_id'))
                this.activityId = activity.id;
            
            if (this.hasFieldName('activity_category_id'))
                this.activityCategoryId = activity.activityCategoryId;
            
            if (this.hasFieldName('fireteam_size') && !this.fireteamSize)
                this.fireteamSize = activity.fireteamSize;
                
            if (this.hasFieldName('est_max_duration') && !this.estMaxDuration)
                this.estMaxDuration = activity.estMaxDuration;
        }
    }
    
    // Activity Category
    set activityCategoryId(value) {
        this.validateFieldName('activity_category_id');
        this.data.activity_category_id = value;
    }
    
    set activityCategory(activityCategory) {
        this.validateFieldName('activity_category_id');
        this.temp.activityCategory = activityCategory;
        
        if (activityCategory) {
            if (this.hasFieldName('activity_category_id'))
                this.activityCategoryId = activityCategory.id;
        }
    }
    
    // Alliance
    set allianceId(value) {
        this.validateFieldName('alliance_id');
        this.data.alliance_id = value;
    }
    
    set alliance(alliance) {
        this.validateFieldName('alliance_id');
        this.temp.alliance = alliance;
        
        if (alliance) {
            if (this.hasFieldName('alliance_id'))
                this.allianceId = alliance.id;
        }
    }
    
    // Channel
    set channelId(value) {
        this.validateFieldName('channel_id');
        this.data.channel_id = value;
    }
    
    set channel(channel) {
        this.validateFieldName('channel_id');
        this.temp.channel = channel;
        
        if (channel) {
            if (this.hasFieldName('channel_id'))
            this.channelId = channel.id;
        }
    }
    
    // Channel Group
    set channelGroupId(value) {
        this.validateFieldName('channel_group_id');
        this.data.channel_group_id = value;
    }
    
    set channelGroup(channelGroup) {
        this.validateFieldName('channel_group_id');
        this.temp.channelGroup = channelGroup;
        
        if (channelGroup) {
            if (this.hasFieldName('channel_group_id'))
                this.channelGroupId = channelGroup.id;
        }
    }
    
    // Creator
    set creatorId(value) {
        this.validateFieldName('creator_id');
        this.data.creator_id = value;
    }
    
    set creator(creator) {
        this.validateFieldName('creator_id');
        this.temp.creator = creator;
        
        if (creator) {
            if (this.hasFieldName('creator_id'))
                this.creatorId = creator.id;
        }
    }
    
    // Event
    set eventId(value) {
        this.validateFieldName('event_id');
        this.data.event_id = value;
    }
    
    set event(event) {
        this.validateFieldName('event_id');
        this.temp.event = event;
        
        if (event) {
            if (this.hasFieldName('event_id'))
                this.eventId = event.id;
        }
    }
    
    // Guild
    set guildId(value) {
        this.validateFieldName('guild_id');
        this.data.guild_id = value;
    }
    
    set guild(guild) {
        this.validateFieldName('guild_id');
        this.temp.guild = guild;
        
        if (guild) {
            if (this.hasFieldName('guild_id'))
                this.guildId = guild.id;
        }
    }
    
    // Guardian
    set guardianId(value) {
        this.validateFieldName('guardian_id');
        this.data.guardian_id = value;
    }
    
    set guardian(guardian) {
        this.validateFieldName('guardian_id');
        this.temp.guardian = guardian;
    }
    
    // Original Channel
    set origChannelId(value) {
        this.validateFieldName('orig_channel_id');
        this.data.orig_channel_id = value;
    }
    
    set origChannel(origChannel) {
        this.validateFieldName('orig_channel_id');
        this.temp.origChannel = origChannel;
        
        if (origChannel) {
            if (this.hasFieldName('orig_channel_id'))
                this.origChannelId = origChannel.id;
        }
    }
    
    // Original Guild
    set origGuildId(value) {
        this.validateFieldName('orig_guild_id');
        this.data.orig_guild_id = value;
    }
    
    set origGuild(origGuild) {
        this.validateFieldName('orig_guild_id');
        this.temp.origGuild = origGuild;
        
        if (origGuild) {
            if (this.hasFieldName('orig_guild_id'))
                this.origGuildId = origGuild.id;
        }
    }
    
    // Original Message
    set origMessageId(value) {
        this.validateFieldName('orig_message_id');
        this.data.orig_message_id = value;
    }
    
    set origMessage(origMessage) {
        this.validateFieldName('orig_message_id');
        this.temp.origMessage = origMessage;
        
        if (origMessage) {
            if (this.hasFieldName('orig_message_id'))
                this.origMessageId = origMessage.id;
        }
    }
    
    // Owner
    set ownerId(value) {
        this.validateFieldName('owner_id');
        this.data.owner_id = value;
    }
    
    set owner(owner) {
        this.validateFieldName('creator_id');
        this.temp.owner = owner;
        
        if (owner) {
            if (this.hasFieldName('owner_id'))
                this.ownerId = owner.id;
        }
    }
    
    // Updater
    set updaterId(value) {
        this.validateFieldName('updater_id');
        this.data.updater_id = value;
    }
    
    set updater(updater) {
        this.validateFieldName('updater_id');
        this.temp.updater = updater;
        
        if (updater) {
            if (this.hasFieldName('updater_id'))
                this.updaterId = updater.id;
        }
    }
    
    // ************************************************************ //
    // * Instance Methods - Helper methods to get related objects * //
    // ************************************************************ //
    
    async getActivity(required = false) {
        if (!this.activity) {
            const Activity = require(`${ROOT}/modules/data/Activity`);
            this.activity = await Activity.get({id: this.activityId, unique: true});
        }
        
        if (!this.activity && required) {
            throw new Error(`Did not find expected activity: id = ${this.activityId}`);
        }
        
        return this.activity;
    }
    
    async getActivityCategory(required = false) {
        if (!this.activityCategory) {
            const ActivityCategory = require(`${ROOT}/modules/data/ActivityCategory`);
            this.activityCategory = await ActivityCategory.get({id: this.activityCategoryId, unique: true});
        }
        
        if (!this.activityCategory && required) {
            throw new Error(`Did not find expected activity category: id = ${this.activityCategoryId}`);
        }
        
        return this.activityCategory;
    }
    
    async getAlliance(required = false) {
        if (!this.alliance) {
            const Alliance = require(`${ROOT}/modules/data/Alliance`);
            this.alliance = await Alliance.get({id: this.allianceId, unique: true});
        }
        
        if (!this.alliance && required) {
            throw new Error(`Did not find expected alliance: id = ${this.allianceId}`);
        }
        
        return this.alliance;
    }
    
    async getChannel(required = false) {
        if (!this.channel) {
            const Channel = require(`${ROOT}/modules/data/Channel`);
            this.channel = await Channel.get({id: this.channelId, unique: true});
        }
        
        if (!this.channel && required) {
            throw new Error(`Did not find expected channel: id = ${this.channelId}`);
        }
        
        return this.channel;
    }
    
    async getChannelGroup(required = false) {
        if (!this.channelGroup) {
            const ChannelGroup = require(`${ROOT}/modules/data/ChannelGroup`);
            this.channelGroup = await ChannelGroup.get({id: this.channelGroupId, unique: true});
        }
        
        if (!this.channelGroup && required) {
            throw new Error(`Did not find expected channel group: id = ${this.channelGroupId}`);
        }
        
        return this.channelGroup;
    }
    
    async getCreator(required = false) {
        if (!this.creator) {
            const Guardian = require(`${ROOT}/modules/data/Guardian`);
            this.creator = await Guardian.get({id: this.creatorId, unique: true});
        }
        
        if (!this.creator && required) {
            throw new Error(`Did not find expected creator (guardian): id = ${this.creatorId}`);
        }
        
        return this.creator;
    }
    
    async getEvent(required = false) {
        if (!this.event) {
            const Event = require(`${ROOT}/modules/data/Event`);
            this.event = await Event.get({id: this.creatorId, unique: true});
        }
        
        if (!this.event && required) {
            throw new Error(`Did not find expected event: id = ${this.eventId}`);
        }
        
        return this.event;
    }
    
    async getGuardian(required = false) {
        if (!this.guardian) {
            const Guardian = require(`${ROOT}/modules/data/Guardian`);
            this.guardian = await Guardian.get({id: this.guardianId, unique: true});
        }
        
        if (!this.guardian && required) {
            throw new Error(`Did not find expected guardian: id = ${this.guardianId}`);
        }
        
        return this.guardian;
    }
    
    async getGuild(required = false) {
        if (!this.guild) {
            const Guild = require(`${ROOT}/modules/data/Guild`);
            this.guild = await Guild.get({id: this.guildId, unique: true});
        }
        
        if (!this.guild && required) {
            throw new Error(`Did not find expected guild: id = ${this.guildId}`);
        }
        
        return this.guild;
    }
    
    async getJoinedFromChannel(required = false) {
        if (!this.joinedFromChannel) {
            const Channel = require(`${ROOT}/modules/data/Channel`);
            this.joinedFromChannel = await Channel.get({id: this.joinedFromChannelId, unique: true});
        }
        
        if (!this.joinedFromChannel && required) {
            throw new Error(`Did not find expected joined from channel: id = ${this.joinedFromChannelId}`);
        }
        
        return this.joinedFromChannel;
    }
    
    async getJoinedFromGuild(required = false) {
        if (!this.joinedFromGuild) {
            const Guild = require(`${ROOT}/modules/data/Guild`);
            this.joinedFromGuild = await Guild.get({id: this.joinedFromGuildId, unique: true});
        }
        
        if (!this.joinedFromGuild && required) {
            throw new Error(`Did not find expected joined from guild: id = ${this.joinedFromGuildId}`);
        }
        
        return this.joinedFromGuild;
    }
    
    async getOrigChannel(required = false) {
        if (!this.origChannel) {
            const Channel = require(`${ROOT}/modules/data/Channel`);
            this.origChannel = await Channel.get({id: this.origChannelId, unique: true});
        }
        
        if (!this.origChannel && required) {
            throw new Error(`Did not find expected original channel: id = ${this.origChannelId}`);
        }
        
        return this.origChannel;
    }
    
    async getOrigGuild(required = false) {
        if (!this.origGuild) {
            const Guild = require(`${ROOT}/modules/data/Guild`);
            this.origGuild = await Guild.get({id: this.origGuildId, unique: true});
        }
        
        if (!this.origGuild && required) {
            throw new Error(`Did not find expected original guild: id = ${this.origGuildId}`);
        }
        
        return this.origGuild;
    }
    
    async getOrigMessage(required = false) {
        if (!this.origMessage) {
            const Message = require(`${ROOT}/modules/data/Message`);
            this.origMessage = await Message.get({id: this.origMessageId, unique: true});
        }
        
        if (!this.origMessage && required) {
            throw new Error(`Did not find expected original message: id = ${this.origMessageId}`);
        }
        
        return this.origMessage;
    }
    
    async getOwner(required = false) {
        if (!this.owner) {
            const Guardian = require(`${ROOT}/modules/data/Guardian`);
            this.owner = await Guardian.get({id: this.ownerId, unique: true});
        }
        
        if (!this.owner && required) {
            throw new Error(`Did not find expected owner (guardian): id = ${this.ownerId}`);
        }
        
        return this.owner;
    }
    
    async getUpdater(required = false) {
        if (!this.updater) {
            const Guardian = require(`${ROOT}/modules/data/Guardian`);
            this.updater = await Guardian.get({id: this.updaterId, unique: true});
        }
        
        if (!this.updater && required) {
            throw new Error(`Did not find expected updater (guardian): id = ${this.updaterId}`);
        }
        
        return this.updater;
    }
}

module.exports = BaseModel;
