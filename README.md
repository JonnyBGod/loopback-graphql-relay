
### Status 🎊
[![npm version](https://badge.fury.io/js/loopback-graphql-relay.svg)](https://badge.fury.io/js/loopback-graphql-relay) [![Build Status](https://travis-ci.org/BlueEastCode/loopback-graphql-relay.svg?branch=master)](https://travis-ci.org/BlueEastCode/loopback-graphql-relay) [![bitHound Overall Score](https://www.bithound.io/github/BlueEastCode/loopback-graphql-relay/badges/score.svg)](https://www.bithound.io/github/BlueEastCode/loopback-graphql-relay) [![bitHound Dependencies](https://www.bithound.io/github/BlueEastCode/loopback-graphql-relay/badges/dependencies.svg)](https://www.bithound.io/github/BlueEastCode/loopback-graphql-relay/develop/dependencies/npm) [![bitHound Dev Dependencies](https://www.bithound.io/github/BlueEastCode/loopback-graphql-relay/badges/devDependencies.svg)](https://www.bithound.io/github/BlueEastCode/loopback-graphql-relay/develop/dependencies/npm) [![bitHound Code](https://www.bithound.io/github/BlueEastCode/loopback-graphql-relay/badges/code.svg)](https://www.bithound.io/github/BlueEastCode/loopback-graphql-relay) [![Known Vulnerabilities](https://snyk.io/test/npm/loopback-graphql-relay/badge.svg)](https://snyk.io/test/npm/loopback-graphql-relay)

# Relay GraphQL Server for Loopback (Apollo Server)

Combine the powers of [ApolloStack](http://www.apollostack.com/) GraphQL with the backend of Loopback to automatically generate GraphQL endpoints based on Loopback Schema.

![Loopback Graphql](./resources/loopback-graphql.png?raw=true "LoopBack Apollo Architecture")

## Queries 💥
- Relay Specification: `node` query to fetch single entity by ID
- `viewer` query to fetch all models for a viewer
- Filter support for `where` and `order` filters on queries
- Support for relations and querying related data
- Relay Connections support for listed data
- Relay Pagination (`first`, `last`, `before`, `after`)
- Remote methods integration

## Mutations 🚀
- Nested and clean schema structure
- Maps all `post`, `put`, `patch` and `delete` methods to mutations
- Remote methods integration

## Subscriptions ⚡️
- `create`, `update` and `remove` events of all shared models.

## Other Features 🎉
### Loopback Types
- [x] Any
- [x] Array
- [x] Boolean
- [ ] Buffer
- [x] Date
- [x] GeoPoint
- [x] Null
- [x] Number
- [x] Object
- [x] String

### Loopback Relations
- [x] BelongsTo
- [x] HasOne
- [x] HasMany
- [ ] HasManyThrough
- [x] HasAndBelongsToMany
- [ ] Polymorphic
- [x] EmbedsOne
- [x] EmbedsMany
- [x] ReferencesMany

### Misc
- Accepts AccessToken for authenticated API calls
- Resolves and respects ACLs

### Todo
- [ ] File uploads


## Usage 💻

```sh
npm install loopback-graphql-relay
```
Add the loopback-graphql-relay component to the `server/component-config.json`:

```
"loopback-graphql-relay": {
    "path": "/graphql",
    "subscriptionServer": {
      "disable": false,
      "auth": false
    },
    "viewer": {
      "UserModel": "Account"
    }
  }
```

Requests will be posted to `path` path. (Default: `/graphql`);

GraphQl Playground is available on `path` path. (Default: `/graphql`);

Apollo's Subscription Server can be customised by passing `subscriptionServer` configuration. More information can be found at [Subscriptions Docs](https://www.apollographql.com/docs/apollo-server/features/subscriptions.html).

```
const { RedisPubSub } = require('graphql-redis-subscriptions')
const path = require('path')
const fs = require('fs')
...

subscriptionServer: {
  disable: false,
  https: {
    key: fs.readFileSync(path.join(__dirname, '.certs/example.key')).toString(),
    cert: fs.readFileSync(path.join(__dirname, '.certs/example.crt')).toString()
  },
  pubsub: new RedisPubSub({
    connection: {
      host: 'cluster-redis-master.default.svc.cluster.local',
      retry_strategy: options => {
        // reconnect after
        return Math.max(options.attempt * 100, 3000)
      }
    }
  })
},
```

Apollo's persistent queries can be customised by passing `persistedQueries` configuration. More information can be found at [Performance Docs](https://www.apollographql.com/docs/guides/performance.html).

```
const { RedisCache } = require('apollo-server-cache-redis')
...

persistedQueries: {
  cache: new RedisCache({
    host: 'cluster-redis-master.default.svc.cluster.local',
    retry_strategy: options => {
      // reconnect after
      return Math.max(options.attempt * 100, 3000)
    }
  })
}
```

## Inspiration 🙌
This repository originally started as a fork of the [loopback-graphql](https://github.com/Tallyb/loopback-graphql) project by [Tallyb](https://github.com/Tallyb). But due to considerable change in the way query end points are created, this repository is maitained as an independant project.

## Roadmap 🛣
[See here the Github project](https://github.com/BlueEastCode/loopback-graphql-relay/projects)
