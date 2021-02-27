
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);
const Snowflake      = require(`${ROOT}/modules/Snowflake`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars
const knex   = require(`${ROOT}/modules/Database`);

class AllianceParameter extends BaseModel {
    static tableName = 'alliance_parameter';
    static orderBy   = 'parameter_name';
    
    constructor(data) {
        super({});
        this.data = data;
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get parameter_id() {
        return this.data.parameter_id;
    }
    
    get alliance_id() {
        return this.data.alliance_id;
    }
    
    get parameter_name() {
        return this.data.parameter_name;
    }
    
    get parameter_value() {
        return this.data.parameter_value;
    }
    
    get updater_id() {
        return this.data.updater_id;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set parameter_id(value) {
        this.data.parameter_id = value;
    }
    
    set alliance_id(value) {
        this.data.alliance_id = value;
    }
    
    set parameter_name(value) {
        this.data.parameter_name = value;
    }
    
    set parameter_value(value) {
        this.data.parameter_value = value;
    }
    
    set updater_id(value) {
        this.data.updater_id = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    // Standard get and create functions
    
    static async get(whereClause) {
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new AllianceParameter(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        const parameters = await AllianceParameter.get(data);
        if (parameters.length > 0) {
            const parameter = parameters[0];
            throw new DuplicateError(`Existing parameter found with the same name: ${parameter.parameter_name}`);
        }
        
        data.parameter_id = Snowflake.generate();
        const result = await this._create(data); // eslint-disable-line no-unused-vars
        return new AllianceParameter(data);
    }
    
    // Extra functions for this class
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async update() {
        
        this.updated_at = knex.fn.now();
        
        let data = {
            alliance_id: this.alliance_id,
            parameter_name: this.parameter_name,
            parameter_value: this.parameter_value,
            updater_id: this.updater_id,
            updated_at: this.updated_at
        };
        
        let rowsChanged = await knex(AllianceParameter.tableName)
            .where('parameter_id', this.parameter_id)
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
        return await AllianceParameter._delete({parameter_id: this.parameter_id});
    }
}

module.exports = AllianceParameter;
