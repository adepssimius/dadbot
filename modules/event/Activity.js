
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const ActivityAlias    = require(`${ROOT}/modules/event/ActivityAlias`);
const BaseModel        = require(`${ROOT}/modules/BaseModel`);
const DuplicateError   = require(`${ROOT}/modules/error/DuplicateError`);
const Snowflake        = require(`${ROOT}/modules/Snowflake`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars
const knex   = require(`${ROOT}/modules/Database`);

class Activity extends BaseModel {
    static tableName = 'activity';
    static orderBy   = 'activity_name';
    
    constructor(data) {
        super(data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get activity_id() {
        return this.data.activity_id;
    }
    
    get activity_name() {
        return this.data.activity_name;
    }
    
    get category_id() {
        return this.data.category_id;
    }

    get fireteam_size() {
        return this.data.fireteam_size;
    }

    get est_max_duration() {
        return this.data.est_max_duration;
    }

    get creator_id() {
        return this.data.creator_id;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set activity_id(value) {
        this.data.activity_id = value;
    }
    
    set activity_name(value) {
        this.data.activity_name = value;
    }
    
    set category_id(value) {
        this.data.category_id = value;
    }

    set fireteam_size(value) {
        this.data.fireteam_size = value;
    }

    set est_max_duration(value) {
        this.data.est_max_duration = value;
    }

    set creator_id(value) {
        this.data.creator_id = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    // Standard get and create functions
    
    static async get(whereClause) {
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new Activity(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        const activities = await Activity.get(data);
        
        if (activities.length > 0) {
            const activity = activities[0];
            throw new DuplicateError(`Existing activity found with the same name [${activity.activity_abbr}] ${activity.activity_name}`);
        }
        
        data.activity_id = Snowflake.generate();
        let result = await this._create(data); // eslint-disable-line no-unused-vars
        return new Activity(data);
    }
    
    // Extra functions for this class
    
    static async getByNameOrAlias(data) {
        return await Activity.get( (query) =>
            query.where('activity_name', data.activity_name)
                .orWhereIn('activity_id', function() {
                    this.select('activity_id').from(ActivityAlias.tableName).where('alias', data.alias);
                })
        );
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async update() {
        this.updated_at = knex.fn.now();
        
        let data = {
            activity_name: this.activity_name,
            category_id: this.category_id,
            fireteam_size: this.fireteam_size,
            est_max_duration: this.est_max_duration,
            creator_id: this.creator_id,
            updated_at: this.updated_at
        };
        
        let rowsChanged = await knex(Activity.tableName)
            .where('activity_id', this.activity_id)
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
        const activityAliases = ActivityAlias.get({activity_id: this.activity_id});
        
        for (let x = 0; x < activityAliases.length; x++) {
            await activityAliases[x].delete();
        }
        
        return await Activity._delete({activity_id: this.activity_id});
    }
    
    async getActivityCategory() {
        const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
        const activityCategories = await ActivityCategory.get({category_id: this.category_id});
        
        if (activityCategories.length == 0) {
            throw new Error(`Unexpectedly did not find an activity category for category_id = '${this.category_id}'`);
        } else if (activityCategories.length > 1) {
            throw new Error(`Unexpectedly found multiple activity categories for category_id = '${this.category_id}'`);
        }
        
        return activityCategories[0];
    }
    
    async getActivityAliases() {
        const ActivityAlias = require(`${ROOT}/modules/event/ActivityAlias`);
        return await ActivityAlias.get({activity_id: this.activity_id});
    }
}

module.exports = Activity;
