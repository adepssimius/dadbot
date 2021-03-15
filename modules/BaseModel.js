
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const camelToSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const snakeToCamelCase = (str) => str.replace( /([-_][a-z])/g, (group) => group.toUpperCase().replace('_', '') );
const capitalize       = (str) => str.charAt(0).toUpperCase() + str.slice(1);

class BaseModel {
    static schema = {
        tableName: null,
        orderBy: 'created_at',
        fields: []
    };
    
    data = {};
	temp = {};
    
    constructor(data) {
        //for (let f = 0; f < this.schema.fields.length; f++) {
        //    const field = this.schema.fields[f];
        //    
        //    if (field.objectFieldName in this) {
        //        Object.defineProperty (this, field.objectFieldName, {
        //            get: function () {
        //                console.log('GET', field.objectFieldName);
        //                return this.data[field.objectFieldName];
        //            },
        //            set: function (value) {
        //                console.log('SET', field.objectFieldName, value);
        //                this.data[field.objectFieldName] = value;
        //            }
        //        });
        //    }
        //}
        
        // Iterate over the incoming field data
        for (const name in data) {
            const object = this.schema.objectMap.get(name);
            if (object) {
                this[object.objectName] = data[object.objectName];
                delete data[object.objectName];
            } else {
                const camelName = snakeToCamelCase(name);
                const field = this.schema.fieldMap.get(camelName);
                if (field) {
                    this[field.objectFieldName] = data[name];
                } else {
                    throw new Error(`Unrecognized field - ${camelName}`);
                }
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
            const knex = require(`${ROOT}/modules/Database`);
            const timestamp = knex.fn.now();
            this.createdAt = timestamp;
            this.updatedAt = timestamp;
        }
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    //static new(data) {
    //    const object = new this(data);
    //    
    //    const handler = {
    //        get: function (target, property, value) {
    //            if (target[property] == undefined) {
    //                target.validateFieldName('id');
    //                return target.data[property];
    //            }
    //            
    //            return Reflect.get(...arguments);
    //        }
    //    };
    //    
    //    return new Proxy(object, handler);
    //}

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
            
            field.objectFieldName = snakeToCamelCase(field.dbFieldName);
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
        
        // Check if we need to add the default primary key
        if (!schema.primaryKey) {
            schema.primaryKey = 'id';
        }
        
        // And return the result
        return schema;
    }
    
    static getField(fieldName) {
        return this.schema.fieldMap.get(fieldName);
    }
    
    static getFieldValidValues(fieldName) {
        const field = this.schema.fieldMap.get(fieldName);
        return ( field && field.validValues ? field.validValues : [] );
    }
    
    //static snakeToCamel(str) {
    //    return str.replace( /([-_][a-z])/g, (group) => group.toUpperCase().replace('_', '') );
    //}
    
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
        const knex = require(`${ROOT}/modules/Database`);
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
    
    static async delete(conditions) {
        let parsedConditions = conditions;
        
        // Parse the select conditions
        if (typeof parsedConditions == 'object') {
            parsedConditions = this.parseConditions(parsedConditions);
            parsedConditions = this.parseFieldConditions(parsedConditions);
        }
        
        // For debugging purposes, generate the sql
        const knex = require(`${ROOT}/modules/Database`);
        const sql = knex(this.schema.tableName)
            .where(parsedConditions)
            .delete()
            .toSQL();
        
        client.logger.debug(`Executing SQL: ${sql.sql}`);
        client.logger.debug(`With Bindings: ${sql.bindings}`);
        
        return await knex(this.schema.tableName)
            .where(parsedConditions)
            .delete()
            .then(result => {
                return result;
            });
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
    
    static getTableName() {
        return this.schema.tableName;
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const knex = require(`${ROOT}/modules/Database`);
        
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
    
    async update(conditions = {id: this.id}) {
        const knex = require(`${ROOT}/modules/Database`);
        
        // Update the timestamp
        this.updatedAt = knex.fn.now();
        
        // For debugging purposes, generate the sql
        const sql = knex(this.schema.tableName)
            .where(conditions)
            .update(this.data)
            .toSQL();
        
        client.logger.debug(`Executing SQL: ${sql.sql}`);
        client.logger.debug(`With Bindings: ${sql.bindings}`);
        
        const rowsChanged = await knex(this.schema.tableName)
            .where(conditions)
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
    
    async delete(conditions = {id: this.id}) {
        const knex = require(`${ROOT}/modules/Database`);
        
        // For debugging purposes, generate the sql
        const sql = knex(this.schema.tableName)
            .where(conditions)
            .delete()
            .toSQL();
        
        client.logger.debug(`Executing SQL: ${sql.sql}`);
        client.logger.debug(`With Bindings: ${sql.bindings}`);
        
        return await knex(this.schema.tableName)
            .where(conditions)
            .delete()
            .then(result => {
                return result;
            });
    }
    
    getTableName() {
        return this.schema.tableName;
    }
    
    // ****************************** //
    // * Field Validation Functions * //
    // ****************************** //
    
    validateFieldName(fieldName) {
        if (!this.hasFieldName(fieldName)) {
            throw new RangeError(`Column ${this.schema.tableName}.${fieldName} does exist`);
        }
        return true;
    }
    
    hasFieldName(fieldName) {
        return this.constructor.schema.fieldMap.has(camelToSnakeCase(fieldName));
    }
    
    // ************ //
    // * Getters  * //
    // ************ //
    
    get schema() {
        return this.constructor.schema;
    }
    
    // Generic get field and object functions
    
    //
    // TODO - We really should figure out how to make these getters and setters properly dynamic
    //
    
    getField(camelName) {
        const snakeName = camelToSnakeCase(camelName);
        this.validateFieldName(snakeName);
        return this.data[snakeName];
    }
    
    getJSONField(camelName) {
        const snakeName = camelToSnakeCase(camelName);
        this.validateFieldName(snakeName);
        return JSON.parse(this.data[snakeName]);
    }
    
    getObject(camelName, camelId = `${camelName}Id`) {
        return this.temp[camelName];
    }
    
    // Standard ID field most tables have
    
    get id                  () { return this.getField('id'); }
    
    // Property fields
    
    get alias               () { return this.getField('alias') }
    get autoDelete          () { return this.getField('autoDelete') }
    get channelName         () { return this.getField('channelName') }
    get clanName            () { return this.getField('clanName') }
    get clanShortName       () { return this.getField('clanShortName') }
    get clanBungieNum       () { return this.getField('clanBungieNum') }
    get commandChannelType  () { return this.getField('commandChannelType') }
    get content             () { return this.getField('content') }
    get description         () { return this.getField('description') }
    get digits              () { return this.getField('digits') }
    get estMaxDuration      () { return this.getField('estMaxDuration') }
    get fireteamSize        () { return this.getField('fireteamSize') }
    get isActive            () { return this.getField('isActive') }
    get isCloneMessage      () { return this.getField('isCloneMessage') }
    get isCommandChannel    () { return this.getField('isCommandChannel' ) }
    get isEventChannel      () { return this.getField('isEvent_channel') }
    get isPrimary           () { return this.getField('isPrimary') }
    get isPrivate           () { return this.getField('isPrivate') }
    get isReactionMessage   () { return this.getField('isReactionMessage') }
    get isSyncChannel       () { return this.getField('isSyncChannel') }
    get isSyncMessage       () { return this.getField('isSyncMessage') }
    get name                () { return this.getField('name') }
    get objectId            () { return this.getField('objectId') }
    get platform            () { return this.getField('platform') }
    get prefix              () { return this.getField('prefix') }
    get privateEventDefault () { return this.getField('privateEventDefault') }
    get reactionMessageType () { return this.getField('reactionMessageType') }
    get startTime           () { return this.getField('startTime') }
    get shortName           () { return this.getField('shortName') }
    get status              () { return this.getField('status') }
    get symbol              () { return this.getField('symbol') }
    get timezone            () { return this.getField('timezone') }
    get type                () { return this.getField('type') }
    get ufid                () { return this.getField('ufid') }
    get username            () { return this.getField('username') }
    get webhookUrl          () { return this.getField('webhookUrl') }
    
    // Standard datetime fields
    
    get createdAt           () { return this.getField('createdAt') }
    get updatedAt           () { return this.getField('updatedAt') }
    
    // Object identifier fields
    
    get activityId          () { return this.getField('activityId'); }
    get activityCategoryId  () { return this.getField('activityCategoryId'); }
    get allianceId          () { return this.getField('allianceId'); }
    get authorId            () { return this.getField('authorId'); }
    get channelId           () { return this.getField('channelId'); }
    get channelGroupId      () { return this.getField('channelGroupId'); }
    get creatorId           () { return this.getField('creatorId'); }
    get eventId             () { return this.getField('eventId'); }
    get guardianId          () { return this.getField('guardianId'); }
    get guildId             () { return this.getField('guildId'); }
    get joinedFromChannelId () { return this.getField('joinedFromChannelId'); }
    get joinedFromGuildId   () { return this.getField('joinedFromGuildId'); }
    get origChannelId       () { return this.getField('origChannelId'); }
    get origGuildId         () { return this.getField('origGuildId'); }
    get origMessageId       () { return this.getField('origMessageId'); }
    get ufid                () { return this.getField('ufid'); }
    get updaterId           () { return this.getField('updaterId'); }
    get webhookId           () { return this.getField('webhookId'); }

    // JSON identifier fields
    
    get ownerIds            () { return this.getJSONField('ownerIds') }
    
    // Objects
    
    get activity          () { return this.getObject('activity'); }
    get activityCategory  () { return this.getObject('activityCategory'); }
    get alliance          () { return this.getObject('alliance'); }
    get author            () { return this.getObject('author'); }
    get channel           () { return this.getObject('channel'); }
    get channelGroup      () { return this.getObject('channelGroup'); }
    get creator           () { return this.getObject('creator'); }
    get discordChannel    () { return this.getObject('discordChannel'); }
    get event             () { return this.getObject('event'); }
    get guardian          () { return this.getObject('guardian'); }
    get guild             () { return this.getObject('guild'); }
    get joinedFromChannel () { return this.getObject('joinedFromChannel'); }
    get joinedFromGuild   () { return this.getObject('joinedFromGuild'); }
    get origChannel       () { return this.getObject('origChannel'); }
    get origGuild         () { return this.getObject('origGuild'); }
    get origMessage       () { return this.getObject('origMessage'); }
  //get owner             () { return this.getObject('owner'); }
    get updater           () { return this.getObject('updater'); }
    get userFriendlyId    () { return this.getObject('userFriendlyId'); }
    get webhook           () { return this.getObject('webhook'); }
    
    // *********** //
    // * Setters * //
    // ********** //
    
    // Generic get field and object functions
    
    //
    // TODO - We really should figure out how to make these getters and setters properly dynamic
    //
    
    setField(value, camelName) {
        const snakeName = camelToSnakeCase(camelName);
        this.validateFieldName(snakeName);
        
        let cleansedValue = value;
        
        if (value) {
            switch (camelName) {
                case 'alias':
                case 'clanShortName':
                case 'shortName':
                case 'symbol':
                    cleansedValue = value.toUpperCase();
                    break;
                
                case 'commandChannelType':
                case 'reactionMessageType':
                case 'type':
                    cleansedValue = value.toLowerCase();
                    break;
                
                case 'createdAt':
                    if (this.createdAt) {
                        throw new Error('Cowardly refusing to change creation timestamp!');
                    }
                    cleansedValue = value;
                    break;
                
                default:
                    cleansedValue = value;
            }
        }
        
        this.data[snakeName] = cleansedValue;
    }
    
    setJSONField(value, camelName) {
        const snakeName = camelToSnakeCase(camelName);
        this.validateFieldName(snakeName);
        
        const jsonValue = (typeof value == 'string' ? value : JSON.stringify(value));
        this.data[snakeName] = jsonValue;
    }
    
    setObject(object, camelName) {
        this.temp[camelName] = object;
    }
    
    // Standard ID field most tables have
    
    set id                  (value) { this.setField(value, 'id'); }
    
    // Property fields
    
    set alias               (value) { this.setField(value, 'alias'); }
    set autoDelete          (value) { this.setField(value, 'autoDelete'); }
    set channelName         (value) { this.setField(value, 'channelName'); }
    set clanName            (value) { this.setField(value, 'clanName'); }
    set clanShortName       (value) { this.setField(value, 'clanShortName'); }
    set clanBungieNum       (value) { this.setField(value, 'clanBungieNum'); }
    set commandChannelType  (value) { this.setField(value, 'commandChannelType'); }
    set content             (value) { this.setField(value, 'content'); }
    set description         (value) { this.setField(value, 'description'); }
    set digits              (value) { this.setField(value, 'digits'); }
    set estMaxDuration      (value) { this.setField(value, 'estMaxDuration'); }
    set fireteamSize        (value) { this.setField(value, 'fireteamSize'); }
    set isActive            (value) { this.setField(value, 'isActive'); }
    set isCloneMessage      (value) { this.setField(value, 'isCloneMessage'); }
    set isCommandChannel    (value) { this.setField(value, 'isCommandChannel'); }
    set isEventChannel      (value) { this.setField(value, 'isEventChannel'); }
    set isPrimary           (value) { this.setField(value, 'isPrimary'); }
    set isPrivate           (value) { this.setField(value, 'isPrivate'); }
    set isReactionMessage   (value) { this.setField(value, 'isReactionMessage'); }
    set isSyncChannel       (value) { this.setField(value, 'isSyncChannel'); }
    set isSyncMessage       (value) { this.setField(value, 'isSyncMessage'); }
    set joinedFromChannelId (value) { this.setField(value, 'joinedFromChannelId'); }
    set joinedFromGuildId   (value) { this.setField(value, 'joinedFromGuildId'); }
    set name                (value) { this.setField(value, 'name'); }
    set objectId            (value) { this.setField(value, 'objectId'); }
    set platform            (value) { this.setField(value, 'platform'); }
    set prefix              (value) { this.setField(value, 'prefix'); }
    set privateEventDefault (value) { this.setField(value, 'privateEventDefault'); }
    set reactionMessageType (value) { this.setField(value, 'reactionMessageType'); }
    set shortName           (value) { this.setField(value, 'shortName'); }
    set startTime           (value) { this.setField(value, 'startTime'); }
    set status              (value) { this.setField(value, 'status'); }
    set symbol              (value) { this.setField(value, 'symbol'); }
    set timezone            (value) { this.setField(value, 'timezone'); }
    set type                (value) { this.setField(value, 'type'); }
    set username            (value) { this.setField(value, 'username'); }
    set webhookUrl          (value) { this.setField(value, 'webhookUrl'); }
    
    // Standard datetime fields
        
    set createdAt           (value) { this.setField(value, 'createdAt'); }
    set updatedAt           (value) { this.setField(value, 'updatedAt'); }
    
    // Object identifier fields
    
    set activityId          (value) { this.setField(value, 'activityId'); }
    set activityCategoryId  (value) { this.setField(value, 'activityCategoryId'); }
    set authorId            (value) { this.setField(value, 'authorId'); }
    set allianceId          (value) { this.setField(value, 'allianceId'); }
    set channelId           (value) { this.setField(value, 'channelId'); }
    set channelGroupId      (value) { this.setField(value, 'channelGroupId'); }
    set creatorId           (value) { this.setField(value, 'creatorId'); }
    set eventId             (value) { this.setField(value, 'eventId'); }
    set guildId             (value) { this.setField(value, 'guildId'); }
    set guardianId          (value) { this.setField(value, 'guardianId'); }
    set origChannelId       (value) { this.setField(value, 'origChannelId'); }
    set origGuildId         (value) { this.setField(value, 'origGuildId'); }
    set origMessageId       (value) { this.setField(value, 'origMessageId'); }
    set ufid                (value) { this.setField(value, 'ufid'); }
    set updaterId           (value) { this.setField(value, 'updaterId'); }
    set webhookId           (value) { this.setField(value, 'webhookId'); }
    
    // JSON identifier fields
    
    set ownerIds            (value) { this.setJSONField(value, 'ownerIds'); }
    
    // Objects
    
    set activity(object) {
        this.setObject(object, 'activity');
        
        if (object) {
            if (this.hasFieldName('activityId'))
                this.activityId = object.id;
            
            if (this.hasFieldName('activityCategoryId'))
                this.activityCategoryId = object.activityCategoryId;
            
            if (this.hasFieldName('fireteamSize') && !this.fireteamSize)
                this.fireteamSize = object.fireteamSize;
                
            if (this.hasFieldName('estMaxDuration') && !this.estMaxDuration)
                this.estMaxDuration = object.estMaxDuration;
        }
    }
    
    set activityCategory (object) { this.setObject(object, 'activityCategory'); }
    set alliance         (object) { this.setObject(object, 'alliance'); }
    set author           (object) { this.setObject(object, 'author'); }
    set channel          (object) { this.setObject(object, 'channel'); }
    set channelGroup     (object) { this.setObject(object, 'channelGroup'); }
    set creator          (object) { this.setObject(object, 'creator'); }
    set discordChannel   (object) { this.setObject(object, 'discordChannel'); }
    set event            (object) { this.setObject(object, 'event'); }
    set guild            (object) { this.setObject(object, 'guild'); }
    set guardian         (object) { this.setObject(object, 'guardian'); }
    set origChannel      (object) { this.setObject(object, 'origChannel'); }
    set origGuild        (object) { this.setObject(object, 'origGuild'); }
    set origMessage      (object) { this.setObject(object, 'origMessage'); }
  //set owner            (object) { this.setObject(object, 'owner'); }
    set updater          (object) { this.setObject(object, 'updater'); }
    
    set userFriendlyId(object) {
        this.setObject(object, 'userFriendlyId');
        
        if (object) {
            if (this.hasFieldName('ufid'))
                this.ufid = object.ufid;
        }
    }
    
    set webhook(object) {
        this.setObject(object, 'webhook');

        if (object) {
            if (this.hasFieldName('webhookId'))
                this.webhookId = object.id;
            
            if (this.hasFieldName('webhookUrl'))
                this.webhookUrl = object.url;
        }
    }
    
    // ************************************************************ //
    // * Instance Methods - Helper methods to get related objects * //
    // ************************************************************ //
    
    async getObjectFromSource(camelName, options = {required: false}, className = capitalize(camelName), camelId = `${camelName}Id`) {
        if (!this[camelName]) {
            switch (camelName) {
                case 'discordChannel':
                    const Channel   = require(`${ROOT}/modules/data/Channel`);
                    camelId = (this.getTableName() == Channel.getTableName() ? 'id' : 'channelId');
                    this[camelName] = await client.channels.fetch(this[camelId]);
                    break;
                
                case 'discordMessage':
                    await this.getDiscordChannel(true);
                    const Message = require(`${ROOT}/modules/data/Message`);
                    camelId = (this.getTableName() == Message.getTableName() ? 'id' : 'messageId');
                    this[camelName] = await this.discordChannel.messages.fetch(this[camelId]);
                    break;
                
                case 'discordUser':
                    const Guardian    = require(`${ROOT}/modules/data/Guardian`);
                    const Participant = require(`${ROOT}/modules/data/Participant`);
                    
                    switch (this.getTableName()) {
                        case    Guardian.getTableName() : camelId = 'id'; break;
                        case Participant.getTableName() : camelId = 'guardianId'; break;
                        default: throw new Error(`Cannot get discordUser for ${this.getTableName()}`);
                    }
                    
                    this[camelName] = await client.users.fetch(this[camelId]);
                    break;
                
                case 'webhook':
                    this[camelName] = await client.fetchWebhook(this.webhookId);
                    break;
                
                default:
                    const Class = require(`${ROOT}/modules/data/${className}`);
                    this[camelName] = await Class.get({id: this[camelId], unique: true});
            }
        }
        
        if (!this[camelName] && options.required) {
            throw new Error(`Did not find expected ${camelToSnakeCase(camelName).replace('_', ' ')}: id = ${this[camelId]}`);
        }
        
        return this[camelName];
    }

    // Get objects from their ultimate source (database or the Discord API)
    
    async getActivity          (options = {required: false}) { return await this.getObjectFromSource( 'activity',          options             ); }
    async getActivityCategory  (options = {required: false}) { return await this.getObjectFromSource( 'activityCategory',  options             ); }
    async getAlliance          (options = {required: false}) { return await this.getObjectFromSource( 'alliance',          options             ); }
    async getAuthor            (options = {required: false}) { return await this.getObjectFromSource( 'author',            options, 'Guardian' ); }
    async getChannel           (options = {required: false}) { return await this.getObjectFromSource( 'channel',           options             ); }
    async getChannelGroup      (options = {required: false}) { return await this.getObjectFromSource( 'channelGroup',      options             ); }
    async getCreator           (options = {required: false}) { return await this.getObjectFromSource( 'creator',           options, 'Guardian' ); }
    async getDiscordChannel    (options = {required: false}) { return await this.getObjectFromSource( 'discordChannel',    options             ); }
    async getDiscordMessage    (options = {required: false}) { return await this.getObjectFromSource( 'discordMessage',    options             ); }
    async getDiscordUser       (options = {required: false}) { return await this.getObjectFromSource( 'discordUser',       options             ); }
    async getEvent             (options = {required: false}) { return await this.getObjectFromSource( 'event',             options             ); }
    async getGuardian          (options = {required: false}) { return await this.getObjectFromSource( 'guardian',          options             ); }
    async getGuild             (options = {required: false}) { return await this.getObjectFromSource( 'guild',             options             ); }
    async getJoinedFromChannel (options = {required: false}) { return await this.getObjectFromSource( 'joinedFromChannel', options             ); }
    async getJoinedFromGuild   (options = {required: false}) { return await this.getObjectFromSource( 'joinedFromGuild',   options             ); }
    async getOrigChannel       (options = {required: false}) { return await this.getObjectFromSource( 'origChannel',       options             ); }
    async getOrigGuild         (options = {required: false}) { return await this.getObjectFromSource( 'origGuild',         options             ); }
    async getOrigMessage       (options = {required: false}) { return await this.getObjectFromSource( 'origMessage',       options             ); }
    async getUpdater           (options = {required: false}) { return await this.getObjectFromSource( 'updater',           options             ); }
    async getWebhook           (options = {required: false}) { return await this.getObjectFromSource( 'webhook',           options             ); }
    
    async getOwners(options = {required: false}) {
        const Guardian = require(`${ROOT}/modules/data/Guardian`);
        const ownerIds = this.ownerIds;
        const owners = [];
        
        for (let o = 0; o < ownerIds.length; o++) {
            const owner = await Guardian.get({id: ownerIds[o], unique: true});
            if (owner) owners.push(owner);
        }
        
        return owners;
    }
    
    async getUserFriendlyId(options = {required: false}) {
        return await this.getObjectFromSource('userFriendlyId', options, 'UserFriendlyId', 'ufid');
    }
}

module.exports = BaseModel;
