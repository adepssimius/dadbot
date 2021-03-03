
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);
const Snowflake      = require(`${ROOT}/modules/Snowflake`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars
const knex   = require(`${ROOT}/modules/Database`);

class ActivityAlias extends BaseModel {
    static tableName = 'activity_alias';
    static orderBy   = 'alias';
    static fields    = ['id', 'alias', 'activity_id', 'alliance_id', 'creator_id'];
    static fieldMap  = BaseModel.getFieldMap(ActivityAlias.fields);
    
    constructor(data = {}) {
        super(ActivityAlias, data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get tableName() {
        return ActivityAlias.tableName;
    }
    
    get alias() {
        return this.data.alias;
    }
    
    get activityId() {
        return this.data.activity_id;
    }
    
    get allianceId() {
        return this.data.alliance_id;
    }
    
    get creatorId() {
        return this.data.creator_id;
    }
    
    get title() {
        return `${this.alias}`;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set alias(value) {
        this.data.alias = value.toUpperCase();
    }
    
    set activityId(value) {
        this.data.activity_id = value;
    }
    
    set allianceId(value) {
        this.data.alliance_id = value;
    }
    
    set creatorId(value) {
        this.data.creator_id = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    // Standard get and create functions
    
    static parseConditions(conditions) {
        // Handle any special fields
        let parsedConditions = conditions;
        
        if (parsedConditions.alias) {
            parsedConditions.alias = parsedConditions.alias.toUpperCase();
        }
        
        return parsedConditions;
    }
    
    // Extra functions for this class
    
    //
    // None yet
    //
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const Activity      = require(`${ROOT}/modules/event/Activity`);
        const activityAlias = await ActivityAlias.get({alias: this.alias, unique: true});
        const activity      = await Activity.get({alias: this.alias}, true);
        
        if (activityAlias) {
            throw new DuplicateError(`Alias is already used by another activity: ${activity.name} [${activityAlias.alias}]`);
        }
        
        // Create the ID for this activity category
        this.id = Snowflake.generate();
        
        // And attempt to create it
        await BaseModel.prototype.create.call(this);
    }
    
    async getActivity() {
        const Activity = require(`${ROOT}/modules/event/Activity`);
        const activity = await Activity.get({id: this.activityId, unique: true});
        
        if (!activity) {
            throw new Error(`Unexpectedly did not find activity with alias = '${this.alias}'`);
        }
        
        return activity;
    }
}

module.exports = ActivityAlias;
