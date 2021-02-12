
// Load the database client
const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    }
});

console.log('Connected to database');

// Freeze and export
Object.freeze(knex);
module.exports = knex;
