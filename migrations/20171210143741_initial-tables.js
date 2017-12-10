
exports.up = function(knex, Promise) {
  return knex.schema.createTable("groups", function(table) {
    table.increments("id");
    table.string("slug");
    table.string("name");
    table.index(["slug"])
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("groups");
};
