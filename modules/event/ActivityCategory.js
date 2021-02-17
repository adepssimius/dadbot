
// Load our classes
const BaseModel      = require('../BaseModel.js');
const DuplicateError = require('../error/DuplicateError');
const Snowflake      = require('../Snowflake');

// Load singletons
const client = require('../Client.js'); // eslint-disable-line no-unused-vars

class ActivityCategory extends BaseModel {
    static tableName = 'activity_category';
    
    constructor(data) {
        super(data);
    }
    
    // ********************* //
    // * Getters & Setters * //
    // ********************* //
    
    get category_id() {
        return this.data.category_id;
    }
    
    get category_name() {
        return this.data.category_name;
    }
    
    get category_abbr() {
        return this.data.category_abbr;
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
            result.push(new ActivityCategory(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        const activityCategories = await ActivityCategory.get(data);
        
        if (activityCategories.length > 0) {
            throw new DuplicateError(`There is already an activity category called '${data.category_name}'`);
        }
        
        data.category_id = Snowflake.generate();
        let result = await this._create(data); // eslint-disable-line no-unused-vars
        return new ActivityCategory(data);
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async delete() {
        return await ActivityCategory._delete({category_id: this.category_id});
    }
}

module.exports = ActivityCategory;
