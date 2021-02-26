
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
    
    constructor(data) {
        super(data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get id() {
        return this.data.id;
    }
    
    get alias() {
        return this.data.alias;
    }
    
    get activity_id() {
        return this.data.activity_id;
    }
    
    get alliance_id() {
        return this.data.alliance_id;
    }
    
    get creator_id() {
        return this.data.creator_id;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set id(value) {
        this.data.id = value;
    }
    
    set alias(value) {
        this.data.alias = value.toUpperCase();
    }
    
    set activity_id(value) {
        this.data.activity_id = value;
    }
    
    set alliance_id(value) {
        this.data.alliance_id = value;
    }
    
    set creator_id(value) {
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
    
    static async create(data) {
        // Always store the alias in uppercase
        if (data != null && data.alias != null) {
            data.alias = data.alias.toUpperCase();
        }
        
        const activityAliases = await ActivityAlias.get(data);
        
        if (activityAliases.length > 0) {
            const activityAlias = activityAliases[0];
            throw new DuplicateError(`Alias is already used by another activity: ${activityAlias.alias}`);
        }
        
        data.id = Snowflake.generate();
        let result = await this._create(data); // eslint-disable-line no-unused-vars
        return new ActivityAlias(data);
    }
    
    // Extra functions for this class
    
    //
    // None yet
    //
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async update() {
        this.updated_at = knex.fn.now();
        
        let data = {
            alias: this.alias,
            activity_id: this.activity_id,
            alliance_id: this.alliance_id,
            updated_at: this.updated_at
        };
        
        let rowsChanged = await knex(ActivityAlias.tableName)
            .where('id', this.id)
            .update(data)
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
