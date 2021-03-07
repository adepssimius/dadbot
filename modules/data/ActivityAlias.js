
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const Snowflake      = require(`${ROOT}/modules/Snowflake`);
const Guardian       = require(`${ROOT}/modules/data/Guardian`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class ActivityAlias extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'activity_alias',
        orderBy: 'alias',
        fields: [
            { dbFieldName: 'id', type: 'snowflake', nullable: false },
            { dbFieldName: 'alias', type: 'unknown', length: 32, nullable: true },
            { dbFieldName: 'activity_id', type: 'string', length: 1, nullable: false },
            { dbFieldName: 'alliance_id', type: 'snowflake', nullable: true },
            { dbFieldName: 'creator_id', type: 'snowflake', nullable: false }
        ]
    });
    
    constructor(data = {}) {
        super(data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get title() {
        return `${this.alias}`;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    // No custom setters required
    
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
        const Activity      = require(`${ROOT}/modules/data/Activity`);
        const activityAlias = await ActivityAlias.get({alias: this.alias, unique: true});
        const activity      = await Activity.get({alias: this.alias, unique: true});
        
        if (activityAlias) {
            throw new DuplicateError(`Alias is already used by another activity: ${activity.name} [${activityAlias.alias}]`);
        }
        
        // Make sure the creator is in the database
        if (await this.getCreator() == null) {
            this.creator = new Guardian({id: this.creatorId});
            await this.creator.create();
        }
        
        // Generate the id and attempt to insert the record into the database
        this.id = Snowflake.generate();
        await BaseModel.prototype.create.call(this);
    }
}

module.exports = ActivityAlias;
