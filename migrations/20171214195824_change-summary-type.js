exports.up = function(knex, Promise) {
    return knex.schema.alterTable('items', function(t) {
        t.text('summary').alter();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.alterTable('items', function(t) {
        t.string('summary').alter();
    });
};
