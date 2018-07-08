/* eslint-disable camelcase */
'use strict';

const Promise = require('bluebird');

const expect = require('chai').expect;
const chai = require('chai').use(require('chai-http'));
const server = require('../server/server');
const cpx = require('cpx');

const gql = require('graphql-tag');
// var _ = require('lodash');

describe('Mutations', () => {

    var authorId = 123;

    before(() => Promise.fromCallback(cb => cpx.copy('./data.json', './data/', cb)));
    after(() => {
    });

  it('should add a single entity', () => {
    const query = gql `
      mutation save($data: JSON!) {
        Author {
          AuthorCreate(input: {data: $data}) {
            obj {
              firstName
              lastName
              birthDate
            }
          }
        }
      }`;
    const variables = {
      data: {
        firstName: 'Unit Test',
        lastName: 'Author',
        birthDate: new Date(),
      },
    };

    return chai.request(server)
      .post('/graphql')
      .send({
        query,
        variables,
      })
      .then((res) => {
        expect(res).to.have.status(200);
        const result = res.body.data;
        expect(result.Author.AuthorCreate.obj.firstName).to.equal(variables.data.firstName);
        expect(result.Author.AuthorCreate.obj.lastName).to.equal(variables.data.lastName);
        authorId = result.Author.AuthorCreate.obj.id;
      });
  });

  it('should add a single entity with sub type', () => {
    const body = 'Heckelbery Finn';
    const query = gql `
      mutation save($data: JSON!) {
        Note {
          NoteCreate(input: { data: $data }) {
            obj {
              id
              title
              content {
                body
              }
              author {
                firstName
                lastName
              }
            }
          }
        }
      }`;
    const variables = {
      data: {
        title: 'Heckelbery Finn',
        authorId: 3,
        content: {
          body,
          footer: 'The end',
        },
      },
    };

    return chai.request(server)
      .post('/graphql')
      .send({
        query,
        variables,
      })
      .then((res) => {
        expect(res).to.have.status(200);
        const result = res.body.data;
        expect(result.Note.NoteCreate.obj.content.body).to.equal(body);
      });
  });

  it('should delete a single entity', () => {
    const query = gql `
      mutation delete($input: AuthorDeleteByIdInput!) {
        Author {
          AuthorDeleteById(input: $input) {
            clientMutationId
          }
        }
      }`;
    const variables = {
      input: {id: '1'},
    };

    return chai.request(server)
      .post('/graphql')
      .send({
        query,
        variables,
      })
      .then((res) => {
        expect(res).to.have.status(200);
      }).catch((err) =>{
        throw err;
      });
  });

  it('should login and return an accessToken', () => {
    const query = gql `
      mutation login ($input: AccountLoginInput!){
        Account {
          AccountLogin(input: $input) {
            obj
          }
        }
      }`;
    const variables = {
      input: {credentials: {username: 'mithoog', password: 'abc'}},
    };

    return chai.request(server)
      .post('/graphql')
      .send({
        query,
        variables,
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.data.Account.AccountLogin.obj).to.have.property('id');
      });
  });

  it('should not login and return an error', () => {
    const query = gql `
    mutation login ($input: AccountLoginInput!){
      Account {
        AccountLogin(input: $input) {
          obj
        }
      }
    }`;

    const variables = {
      input: {credentials: {username: 'aatif', password: 'wrong'}},
    };

    return chai.request(server)
      .post('/graphql')
      .send({
        query,
        variables,
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('errors');
      }).catch((err) => {
        console.log(err);
      });
  });
});
