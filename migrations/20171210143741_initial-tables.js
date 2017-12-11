exports.up = function(knex, Promise) {
  return knex.schema.createTable("groups", table => {
    table.string("slug").primary();
    table.string("name");
    table.integer("thread");
    table.timestamp("created_at", true);
    table.timestamp("updated_at", true);
  }).then(() => {
    return knex.schema.createTable("geeklists", table => {
      table.integer("id").primary();
      table.string("title");
      table.integer("year");
      table.integer("month");
      table.boolean("update");
      table.string("group_slug");
      table.foreign("group_slug").references("groups.slug");
      table.timestamp("created_at", true);
      table.timestamp("updated_at", true);
      table.timestamp("next_update_at", true);
      table.index(["next_update_at"]);
      table.index(["id", "group_slug"]);
      table.index(["group_slug", "year", "month"]);
    });
  }).then(() => {
    return knex.schema.createTable("items", table => {
      table.integer("id").primary();
      table.string("objecttype");
      table.string("subtype");
      table.integer("objectid");
      table.string("objectname");
      table.string("username");
      table.integer("thumbs");
      table.integer("imageid");
      table.string("summary");
      table.decimal("rating", 2, 1);
      table.timestamp("postdate", true);
      table.integer("geeklist_id");
      table.foreign("geeklist_id").references("geeklists.id");
      table.timestamp("created_at", true);
      table.timestamp("updated_at", true);
      table.index(["username"]);
      table.index(["postdate"]);
      table.index(["geeklist_id"]);
      table.index(["objecttype", "subtype", "objectid"]);
    });
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("items")
    .then(() => {
      return knex.schema.dropTable("geeklists")
        .then(() => {
          return knex.schema.dropTable("groups");
        });
    });
};
