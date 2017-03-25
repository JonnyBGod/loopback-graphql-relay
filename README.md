
### Status
[![Build Status](https://travis-ci.org/BlueEastCode/loopback-graphql-relay.svg?branch=master)](https://travis-ci.org/BlueEastCode/loopback-graphql-relay)

# Relay GraphQL Server for Loopback (Apollo Server)

Combine the powers of [ApolloStack](http://www.apollostack.com/) GraphQL with the backend of Loopback.

Uses [graphql-js](https://github.com/graphql/graphql-js) and [graphql-relay-js](https://github.com/graphql/graphql-relay-js) to compile schema.

All of Loopback models are exposed as GraphQL Queries.

Define models in Loopback to be exposed as REST APIs and GraphQL queries and mutations *.

Use the Apollo [clients](http://dev.apollodata.com/) to access your data. 

![Loopback Graphql](./resources/loopback-graphql.png?raw=true "LoopBack Apollo Architecture") 

## Getting started

```sh
npm install loopback-graphql-relay
```
Add the loopback-graphql-relay component to the `server/component-config.json`: 

```
"loopback-graphql-relay": {
    "path": "/graphql",
    "graphiqlPath": "/graphiql",
    "subscriptionServer": {
      "port": 5000,
      "options": {},
      "socketOptions": {}
    },
  }
```

Requests will be posted to `path` path. (Default: `/graphql`);

Graphiql is available on `graphiqlPath` path. (Default: `/graphiql`);

Apollo's Subscription Server can be customised by passing `subscriptionServer` configuration. More information can be found at [SubscriptionServer Docs](https://github.com/apollographql/subscriptions-transport-ws#subscriptionserver).

## Usage

Access the Graphiql interface to view your GraphQL model onthe Docs section. 
Build the GraphQL queries and use them in your application.

The following actions are supported: 
###  Queries
* Node query to fetch single entity by ID
* Multiple entities with pagination (first, after)
* Relationship between entities (belongs to, has many)

### Mutations
* Save single object
* Delete single object 

### Subscriptions
* `create`, `update` and `remove` events of all shared models.

## Inspiration
This repository originally started as a fork of the [loopback-graphql](https://github.com/Tallyb/loopback-graphql) project by [Tallyb](https://github.com/Tallyb). But due to considerable change in the way query end points are created, this repository is maitained as an independant project.

## Roadmap
[See here the Github project](https://github.com/BlueEastCode/loopback-graphql-relay/projects)