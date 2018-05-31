'use strict';

const expect = require('chai').expect;
const chai = require('chai')
.use(require('chai-http'));
const server = require('../server/server');
const gql = require('graphql-tag');
const Promise = require('bluebird');
const cpx = require('cpx');

describe('Queries', () => {

  before(() => Promise.fromCallback(cb => cpx.copy('./data.json', './data/', cb)));

  describe('Single entity', () => {
    let accessToken;
    before(() => {
      // login
      const query = gql `
      mutation login {
        Account {
          AccountLogin(input:{
            credentials: {
              username: "mithoog", 
              password: "abc"
            }
          }) {
            obj
          }
        }
      }`;
      return chai.request(server)
      .post('/graphql')
      .send({
        query
      })
      .then((res) => {
        accessToken = res.body.data.Account.AccountLogin.obj.id;
      });
    });

    it('should fetch sites of owner only', () => {
      const query = gql `
            query {
              viewer {
                sites {
                  edges {
                    node {
                      name
                      owner {
                        username
                      }
                    }
                  }
                }
              }
            }`;
      return chai.request(server)
      .post('/graphql')
      .set('Authorization', accessToken)
      .send({
        query
      })
      .then((res) => {
        expect(res).to.have.status(200);
        const result = res.body.data;
        expect(result.viewer.sites.edges.length).to.equal(2);
        expect(result.viewer.sites.edges[0].node.owner.username).to.equal('mithoog');
      });
    });

  });
});

