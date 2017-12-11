module.exports = {
  development: {
    // client: "sqlite3",
    // connection: {
    //   filename: "./geeklist-api-dev.sqlite"
    // },
    // useNullAsDefault: true
    client: "pg",
    connection: {
      host: "localhost",
      database: "geeklist-api-dev"
    },
    pool: {
      min: 2,
      max: 2
    }
  },

  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    }
  }
};
