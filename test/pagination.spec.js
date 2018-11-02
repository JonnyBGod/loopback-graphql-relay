/* eslint-disable no-unused-expressions */

'use strict';

const Promise = require('bluebird');

const expect = require('chai').expect;
const chai = require('chai')
  .use(require('chai-http'));
const server = require('../server/server');
const cpx = require('cpx');

const {fromGlobalId} = require('graphql-relay');

describe('Pagination', () => {

  before(() => Promise.fromCallback(cb => cpx.copy('./data.json', './data/', cb)));
  let accessToken;
  before(() => {
    accessToken = 'ZDRBGfgwCVrtgxHERTiSH6B9jrZ30Uv1Dq3dzeRNxaFEmrVimQTPZ3fsHFEsLdv5';
    // login
    const query = `
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

  it('should query first 2 entities', () => {
    const query = `{
      viewer {
        sites(first: 2) {
          totalCount
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            node {
              id
              name
            }
            cursor
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
        res = res.body.data;
        expect(res.viewer.sites.edges.length).to.equal(2);
        expect(res.viewer.sites.totalCount).to.equal(2);
      });
  });

  it('should query entity after cursor', () => {
    const query = `{
      Site {
        SiteFind(after: "YXJyYXljb25uZWN0aW9uOjQ=", first: 1) {
          totalCount
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            node {
              id
              name
            }
            cursor
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
        res = res.body.data;
        expect(res.Site.SiteFind.edges.length).to.be.above(0);
        expect(fromGlobalId(res.Site.SiteFind.edges[0].node.id).id).to.equal('6');
        expect(res.Site.SiteFind.pageInfo.hasNextPage).to.be.true;
      });
  });

  it('should query entity after cursor', () => {
    const query = `{
      viewer {
        sites(after: "Y29ubmVjdGlvbi4x", first: 1) {
          totalCount
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            node {
              id
              name
            }
            cursor
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
        res = res.body.data;
        expect(res.viewer.sites.totalCount).to.equal(2);
        expect(res.viewer.sites.edges.length).to.be.above(0);
        expect(fromGlobalId(res.viewer.sites.edges[0].node.id).id).to.equal('6');
        expect(res.viewer.sites.pageInfo.hasNextPage).to.be.true;
      });
  });

  it('should query related entity on edge', () => {
    const query = `{
			viewer {
				sites (after: "U2l0ZTox", first: 1) {
					pageInfo {
						hasNextPage
						hasPreviousPage
						startCursor
						endCursor
					}
					edges {
						node {
							id
							name
							books {
								totalCount
								edges {
									node {
										name
									}
								}
							}
						}
						cursor
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
        res = res.body.data;
        expect(res.viewer.sites.edges[0].node.name).to.equal('BlueEastHq');
        expect(res.viewer.sites.edges[0].node.books.edges.length).to.be.equal(0);
        expect(res.viewer.sites.edges[0].node.books.totalCount).to.be.equal(0);
        expect(res.viewer.sites.edges[0].cursor).not.to.be.empty;
      });
  });
});
