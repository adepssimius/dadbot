
// Load our classes
const BaseModel      = require('../BaseModel.js');
const DuplicateError = require('../error/DuplicateError');
const Snowflake      = require('../Snowflake');

// Load singletons
const client = require('../Client.js'); // eslint-disable-line no-unused-vars

class Activity extends BaseModel {
    static tableName = 'activity';
    
    constructor(data) {
        super(data);
    }
    
    // ********************* //
    // * Getters & Setters * //
    // ********************* //
    
    get activity_id() {
        return this.data.activity_id;
    }
    
    get activity_name() {
        return this.data.activity_name;
    }
    
    get activity_abbr() {
        return this.data.activity_abbr;
    }
    
    get category_id() {
        return this.data.sync_group_id;
    }

    get max_guardians() {
        return this.data.max_guardians;
    }

    get estimated_mins() {
        return this.data.estimated_mins;
    }

    get creator_id() {
        return this.data.creator_id;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
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
            throw new DuplicateError(`There is already an activity called '${data.activity_name}'`);
        }
        
        data.activity_id = Snowflake.generate();
        let result = await this._create(data); // eslint-disable-line no-unused-vars
        return new Activity(data);
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async delete() {
        return await Activity._delete({activity_id: this.activity_id});
    }
}

module.exports = Activity;
