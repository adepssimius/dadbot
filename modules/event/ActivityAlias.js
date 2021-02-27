
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
    
    constructor(data = {}) {
        if (data.id == null) data.id = Snowflake.generate();
        super(data);
        
        // Populate custom fields with the same database and object name
        if (data.alias != null) this.alias = data.alias;
        
        // Populate custom fields with different database and object names
        if      (data.activity_id != null) this.activityId = data.activity_id;
        else if (data.activityId  != null) this.activityId = data.activityId;
        
        if      (data.alliance_id != null) this.allianceId = data.alliance_id;
        else if (data.allianceId  != null) this.allianceId = data.allianceId;
        
        if      (data.creator_id  != null) this.creatorId  = data.creator_id;
        else if (data.creatorId   != null) this.creatorId  = data.creatorId;
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
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
    
    static async get(whereClause) {
        // Always search alias in upper case
        if (whereClause != null && whereClause.alias != null) {
            whereClause.alias = whereClause.alias.toUpperCase();
        }
        
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new ActivityAlias(rows[x]));
        }
        
        return result;
    }

    // Extra functions for this class
    
    //
    // None yet
    //
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const BaseModel = require(`${ROOT}/modules/BaseModel`);
        
        const activityAliases = await ActivityAlias.get({alias: this.alias});
        if (activityAliases.length > 0) {
            const activityAlias = activityAliases[0];
            throw new DuplicateError(`Alias is already used by another activity: ${activityAlias.alias}`);
        }
        
        await BaseModel.create.call(this, ActivityAlias.tableName, this.data);
    }
    
    async update() {
        this.updated_at = knex.fn.now();
        
        let rowsChanged = await knex(ActivityAlias.tableName)
            .where('id', this.id)
            .update(this.data)
            .then(result => {
                return result;
            });
        
        if (rowsChanged == 0) {
            throw new Error('Update did not change any records!');
        } else if (rowsChanged > 1) {
            throw new Error('Update changed more then one record!');
        }
    }
    
    async delete() {
        return await ActivityAlias._delete({id: this.id});
    }
    
    async getActivity() {
        const Activity = require(`${ROOT}/modules/event/Activity`);
        const activities = await Activity.get({'activity_id': this.activity_id});
        
        if (activities.length == 0) {
            throw new Error(`Unexpectedly did not find an activity with alias = '${this.alias}'`);
        } else if (activities.length > 1) {
            throw new Error(`Unexpectedly found multiple activities with alias = '${this.alias}'`);
        }
        
        return activities[0];
    }
}

module.exports = ActivityAlias;
