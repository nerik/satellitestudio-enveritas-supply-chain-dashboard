const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');

const supplychain = require('../src/supplychain.json');
const rawSchema = fs.readFileSync(path.join(__dirname, 'supplychain.graphql'), 'utf8');
const schema = buildSchema(rawSchema);

const rootValue = {
  ...supplychain
};

const PORT = 2999;

const graphQLServer = express();

graphQLServer.use('/', cors(), graphqlHTTP({
  schema,
  rootValue,
  graphiql : true,
}));

graphQLServer.listen(PORT);

console.log(`GraphQL Express server started on http://localhost:${PORT}/`);


