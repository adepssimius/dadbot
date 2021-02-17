
// Load our classes
const BaseModel      = require('../BaseModel.js');
const DuplicateError = require('../error/DuplicateError');
const Snowflake      = require('../Snowflake');

// Load singletons
const client = require('../Client.js'); // eslint-disable-line no-unused-vars

class Guardian extends BaseModel {
    static tableName = 'guardian';
    
    constructor(data) {
        super(data);
    }
    
    // ********************* //
    // * Getters & Setters * //
    // ********************* //
    
    get guardian_id() {
        return this.data.category_id;
    }
    
    get timezone() {
        return this.data.timezone;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static async get(whereClause) {
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new Guardian(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        const guardians = await Guardian.get(data);
        
        if (guardians.length > 0) {
            throw new DuplicateError(`There is already a guardian with the ID ${data.guardian_id}`);
        }
        
        data.guardian_id = Snowflake.generate();
        let result = await this._create(data); // eslint-disable-line no-unused-vars
        return new Guardian(data);
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async delete() {
        return await Guardian._delete({guardian_id: this.guardian_id});
    }
}

module.exports = Guardian;
