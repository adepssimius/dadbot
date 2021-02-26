
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

// Load the database client
const knex = require('knex')(client.config.database);

console.log('Connected to database');

// ******************* //
// * Alliance Tables * //
// ******************* //

knex.schema.hasTable('guardian').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('guardian', function (table) {
            table.string('id', 20).notNullable();
            table.primary('id');
            
            table.string('timezone', 32).notNullable();
            table.timestamps(false, true);
            
        }).then(client.logger.log('Created Table: guardian'));
    }
});

knex.schema.hasTable('guild').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('guild', function (table) {
            table.string('guild_id', 20).notNullable();
            table.primary('guild_id');
            
            table.string ('alliance_id', 20).notNullable();
            table.string ('clan_name', 25);
            table.string ('clan_alias', 4);
            table.integer('clan_id');
            table.string ('timezone', 32);
            table.timestamps();
            
            //
            // Foreign Keys
            //
            
            //table.foreign('alliance_id', 'guild_fk1')
            //    .references('alliance_id')
            //    .inTable('alliance');
            
        }).then(client.logger.log('Created Table: guild'));
    }
});

knex.schema.hasTable('alliance').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('alliance', function (table) {
            table.string('alliance_id', 20).notNullable();
            table.primary('alliance_id');
            
            table.string('alliance_name', 32).notNullable();
            table.string('alliance_alias', 4).notNullable();
            table.string('creator_id', 20).notNullable();
            table.timestamps(false, true);
            
            //
            // Foreign Keys
            //
            
            //table.foreign('creator_id', 'alliance_fk1')
            //    .references('id')
            //    .inTable('guardian');
            
        }).then(client.logger.log('Created Table: alliance'));
    }
});

knex.schema.hasTable('alliance_parameter').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('alliance_parameter', function (table) {
            table.string('parameter_id', 20).notNullable();
            table.primary('parameter_id');
            
            table.string('alliance_id', 20).notNullable();
            table.string('parameter_name', 32).notNullable();
            table.string('parameter_value', 4096);
            table.string('updater_id', 20).notNullable();
            table.string('creator_id', 20).notNullable();
            table.timestamps(false, true);
            
            //
            // Foreign Keys
            //
            
            //table.foreign('alliance_id', 'alliance_parameter_fk1')
            //    .references('alliance_id')
            //    .inTable('alliance');
            
            //table.foreign('creator_id', 'alliance_parameter_fk2')
            //    .references('id')
            //    .inTable('guardian');
            
            //table.foreign('updater_id', 'alliance_parameter_fk3')
            //    .references('id')
            //    .inTable('guardian');
            
        }).then(client.logger.log('Created Table: alliance_parameter'));
    }
});

// ********************************** //
// * Channel Synchronization Tables * //
// ********************************** //

knex.schema.hasTable('sync_group').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('sync_group', function (table) {
            table.string('sync_group_id', 20).notNullable();
            table.primary('sync_group_id');
            
            table.string('name', 32).notNullable();
            table.timestamps(false, true);
        }).then(client.logger.log('Created Table: sync_group'));
    }
});

knex.schema.hasTable('channel').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('channel', function (table) {
            table.string('channel_id', 20).notNullable();
            table.primary(['channel_id']);
            
            table.string('sync_group_id', 20).notNullable();
            table.string('guild_id', 20).notNullable();
            table.string('webhook_id', 20).notNullable();
            table.string('webhook_url', 256).notNullable();
            table.timestamps(false, true);
            
            //
            // Foreign Keys
            //
            
            //table.foreign('sync_group_id', 'channel_fk1')
            //    .references('sync_group_id')
            //    .inTable('sync_group');
            
            // TODO - Add this in when we integrate the guild table into the code
            //table.foreign('guild_id', 'channel_fk2')
            //    .references('guild_id')
            //    .inTable('guild');
            
        }).then(client.logger.log('Created Table: channel'));
    }
});

knex.schema.hasTable('message').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('message', function (table) {
            table.string('message_id', 20).notNullable();
            table.primary(['message_id']);
            
            table.string ('sync_group_id', 20).notNullable();
            table.string ('channel_id', 20).notNullable();
            table.string ('guild_id', 20).notNullable();
            table.boolean('is_clone').notNullable().defaultTo(false);
            table.string ('orig_message_id', 20);
            table.string ('orig_channel_id', 20);
            table.string ('orig_guild_id', 20);
            table.string ('content', 2000);
            table.timestamps(false, true);
            
            //
            // Foreign Keys
            //
            
            //table.foreign('sync_group_id', 'message_fk1')
            //    .references('sync_group_id')
            //    .inTable('sync_group');
            
            //table.foreign('channel_id', 'message_fk2')
            //    .references('channel_id')
            //    .inTable('channel');
            
            // TODO - Add this in when we integrate the guild table into the code
            //table.foreign('guild_id', 'message_fk3')
            //    .references('guild_id')
            //    .inTable('guild');
            
            //table.foreign('orig_message_id', 'message_fk4')
            //    .references('message_id')
            //    .inTable('message');
            
            //table.foreign('orig_channel_id', 'message_fk5')
            //    .references('channel_id')
            //    .inTable('channel');
            
            // TODO - Add this in when we integrate the guild table into the code
            //table.foreign('orig_guild_id', 'message_fk6')
            //    .references('guild_id')
            //    .inTable('guild');
            
        }).then(client.logger.log('Created Table: message'));
    }
});

// **************************** //
// * Looking for Group Tables * //
// **************************** //

knex.schema.hasTable('activity_category').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('activity_category', function (table) {
            table.string('category_id', 20).notNullable();
            table.primary('category_id');
            
            table.string('category_name', 32).notNullable();
            table.string('symbol', 1).notNullable();
            table.string('alliance_id', 20);
            table.string('creator_id', 20).notNullable();
            table.timestamps(false, true);
            
            //
            // Foreign Keys
            //
            
            //table.foreign('alliance_id', 'activity_category_fk1')
            //    .references('alliance_id')
            //    .inTable('alliance');
            
            //table.foreign('creator_id', 'activity_category_fk2')
            //    .references('id')
            //    .inTable('guardian');
            
        }).then(client.logger.log('Created Table: activity_category'));
    }
});

knex.schema.hasTable('activity').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('activity', function (table) {
            table.string('activity_id', 20).notNullable();
            table.primary('activity_id');
            
            table.string ('activity_name', 32).notNullable();
            table.string ('category_id', 20).notNullable();
            table.integer('fireteam_size').notNullable();
            table.integer('est_max_duration').notNullable();
            table.string ('alliance_id', 20);
            table.string ('creator_id', 20).notNullable();
            table.timestamps(false, true);
            
            //
            // Foreign Keys
            //
            
            //table.foreign('category_id', 'activity_fk1')
            //    .references('category_id')
            //    .inTable('activity_category');
            
            //table.foreign('alliance_id', 'activity_fk2')
            //    .references('alliance_id')
            //    .inTable('alliance');
            
            //table.foreign('creator_id', 'activity_fk3')
            //    .references('id')
            //    .inTable('guardian');
            
        }).then(client.logger.log('Created Table: activity'));
    }
});

knex.schema.hasTable('activity_alias').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('activity_alias', function (table) {
            table.string('id', 20).notNullable();
            table.primary('id');
            
            table.string ('alias', 16).notNullable();
            table.string ('activity_id', 20).notNullable();
            table.string ('alliance_id', 20);
            table.string ('creator_id', 20).notNullable();
            table.timestamps(false, true);
            
            //
            // Foreign Keys
            //
            
            //table.foreign('activity_id', 'activity_alias_fk1')
            //    .references('activity_id')
            //    .inTable('activity');
            
            //table.foreign('alliance_id', 'activity_alias_fk2')
            //    .references('alliance_id')
            //    .inTable('alliance');
            
            //table.foreign('creator_id', 'activity_alias_fk3')
            //    .references('id')
            //    .inTable('guardian');
            
        }).then(client.logger.log('Created Table: activity_alias'));
    }
});

knex.schema.hasTable('event').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('event', function (table) {
            table.string('id', 20).notNullable();
            table.primary('id');
            
            table.string   ('alliance_id', 20);
            table.string   ('activity_id', 20).notNullable();
            table.string   ('category_id', 20).notNullable();
            table.string   ('platform', 16).notNullable();
            table.string   ('guild_id', 20).notNullable();
            table.string   ('description', 256);
            table.timestamp('start_time').notNullable();
            table.integer  ('fireteam_size').notNullable();
            table.integer  ('estimated_mins').notNullable();
            table.boolean  ('is_private').notNullable();
            table.boolean  ('auto_delete').notNullable();
            table.string   ('creator_id', 20).notNullable();
            table.string   ('owner_id', 20).notNullable();
            table.timestamps(false, true);
            
            //
            // Foreign Keys
            //
            
            //table.foreign('alliance_id', 'event_fk1')
            //    .references('alliance_id')
            //    .inTable('alliance');
            
            //table.foreign('activity_id', 'event_fk2')
            //    .references('activity_id')
            //    .inTable('activity');
            
            //table.foreign('category_id', 'event_fk3')
            //    .references('category_id')
            //    .inTable('event_category');
            
            // TODO - Add this in when we integrate the guild table into the code
            //table.foreign('guild_id', 'event_fk4')
            //    .references('guild_id')
            //    .inTable('guild');
            
            //table.foreign('creator_id', 'event_fk5')
            //    .references('id')
            //    .inTable('guardian');
            
            //table.foreign('owner_id', 'event_fk6')
            //    .references('id')
            //    .inTable('guardian');

        }).then(client.logger.log('Created Table: event'));
    }
});

knex.schema.hasTable('event_channel').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('event_channel', function (table) {
            table.string('channel_id', 20).notNullable();
            table.primary('channel_id');
            
            table.string('event_id', 20).notNullable();
            table.string('channel_guild_id', 20).notNullable();
            table.timestamps(false, true);
            
            //
            // Foreign Keys
            //
            
            //table.foreign('channel_id', 'event_channel_fk1')
            //    .references('channel_id')
            //    .inTable('channel');
            
            //table.foreign('event_id', 'event_channel_fk2')
            //    .references('id')
            //    .inTable('event');
            
            //table.foreign('channel_guild_id', 'event_channel_fk3')
            //    .references('guild_id')
            //    .inTable('guild');
            
        }).then(client.logger.log('Created Table: event_channel'));
    }
});

knex.schema.hasTable('participant').then(function(exists) {
    if (!exists) {
        knex.schema.createTable('participant', function (table) {
            table.string('guardian_id', 20).notNullable();
            table.string('event_id', 20).notNullable();
            table.primary('guardian_id', 'event_id');
            
            table.string('joined_from_channel_id', 20).notNullable();
            table.string('joined_from_guild_id', 20).notNullable();
            table.boolean('is_primary', 20).notNullable().defaultTo(true);
            table.timestamps(false, true);
            
            //
            // Foreign Keys
            //
            
            //table.foreign('event_id', 'activity_member_fk1')
            //    .references('id')
            //    .inTable('event');
            
            //table.foreign('guardian_id', 'activity_member_fk2')
            //    .references('id')
            //    .inTable('guardian');
            
            //table.foreign('channel_id', 'activity_member_fk3')
            //    .references('channel_id')
            //    .inTable('channel');
            
            //table.foreign('guild_id', 'activity_member_fk4')
            //    .references('guild_id')
            //    .inTable('guild');
            
        }).then(client.logger.log('Created Table: participant'));
    }
});

// Freeze and export
Object.freeze(knex);
module.exports = knex;
