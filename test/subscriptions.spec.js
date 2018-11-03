'use strict';
const ws = require('ws');
const { SubscriptionClient } = require('subscriptions-transport-ws');
const { ApolloClient } = require('apollo-client');
const { HttpLink } = require('apollo-link-http');
const { InMemoryCache } = require('apollo-cache-inmemory');
const cpx = require('cpx');

const Promise = require('bluebird');
const expect = require('chai').expect;
const chai = require('chai').use(require('chai-http'));
const server = require('../server/server');
const gql = require('graphql-tag');

let apollo;
let networkInterface;
let app
const GRAPHQL_ENDPOINT = 'ws://localhost:2000/graphql';

describe('Subscriptions', () => {
  before(() => Promise.fromCallback(cb => cpx.copy('./data.json', './data/', cb)));
  before(() => app = server.start());
  before(async () => {
    networkInterface = new SubscriptionClient(GRAPHQL_ENDPOINT, { reconnect: true }, ws);
    apollo = new ApolloClient({
      networkInterface,
      link: new HttpLink({ uri: 'http://localhost:2000/graphql' }),
      cache: new InMemoryCache()
    });
  });

  after(done => {
      networkInterface.close() ;
      app.close(done)
  });

  xit('subscription', async () => {
    // SUBSCRIBE and make a promise
    const options = {
      query: gql`
        subscription {
          Customer(input: {
            create: true
            clientSubscriptionId: 112
            options: { where: {age: 50} }
          }) {
            customer {
              name
              age
            }
            type
            clientSubscriptionId
          }
        }
      `
    };

    const subscriptionPromise = new Promise((resolve, reject) => {
      const client = () => apollo;
      client().subscribe(options).subscribe({
        next: (res) => {
          console.log('next', res)
          return resolve(res)
        },
        error: (err) => {
          console.error('err', err)
          return reject(err)
        }
      });
    });

    const query =
      `mutation {
        Customer {
          CustomerCreate (input:{data:{name:"Atif 21", age:50}}) {
            obj {
              id
              name
            }
          }
        }
      }`;

    return chai.request(server)
      .post('/graphql')
      .send({
        query,
      })
      .then(async (res) => {
        expect(res).to.have.status(200);
        // ASSERT SUBSCRIPTION RECEIVED EVENT
        const promiseResult = await subscriptionPromise
        expect(promiseResult.data).to.deep.equal({
          Customer: {
            __typename: 'CustomerSubscriptionPayload',
            customer: {
              name: "Atif 21",
              age:50
            },
            type: 'create',
            clientSubscriptionId: 112
          }
        });
      });
  });

  // xit('subscribeToMore', async () => {
  //   // SUBSCRIBE and make a promise
  //   let queryRef
  //   const options = {
  //     query: gql`
  //       subscription {
  //         Customer(input: {
  //           create: true
  //           clientSubscriptionId: 112
  //           where: {age: 50}
  //         }) {
  //           customer {
  //             name
  //             age
  //           }
  //         }
  //       }
  //     `
  //   };
  //   let times = 0
  //   const subscriptionPromise = new Promise((resolve, reject) => {
  //     const client = () => apollo;
  //     client().subscribe(options).subscribe({
  //         next: (res) => {
  //           console.log(res, times)
  //           if (times > 0) {
  //             resolve(res)
  //           }
  //           times += 1
  //         },
  //         error: reject
  //     });
  //   });

  //   const query =
  //     `mutation {
  //       Customer {
  //         CustomerCreate (input:{data:{name:"Atif 21", age:50}}) {
  //           obj {
  //             id
  //             name
  //           }
  //         }
  //       }
  //     }`;

  //   return chai.request(server)
  //     .post('/graphql')
  //     .send({
  //       query,
  //     })
  //     .then(async (res) => {
  //       expect(res).to.have.status(200);
  //       // ASSERT SUBSCRIPTION RECEIVED EVENT
  //       const promiseResult = await subscriptionPromise
  //       console.log(promiseResult)
  //       expect(promiseResult.data).to.deep.equal({
  //         Customer: {
  //           __typename: 'CustomerSubscriptionPayload',
  //           customer: {
  //             name: "Atif 21",
  //             age:50
  //           }
  //         }
  //       });
  //     });
  // });
});
