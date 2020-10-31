require("dotenv").config();
const { ELASTICSEARCH_ENDP } = process.env;

const { Client } = require("@elastic/elasticsearch");
const client = new Client({
  node: ELASTICSEARCH_ENDP,
});

module.exports = client;
