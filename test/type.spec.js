'use strict';

const expect = require('chai').expect;
const chai = require('chai')
  .use(require('chai-http'));
const server = require('../server/server');
const Promise = require('bluebird');
const cpx = require('cpx');

describe('Types', () => {
  before(() => Promise.fromCallback(cb => cpx.copy('./data.json', './data/', cb)));

  describe('GeoPoint', () => {
    it('should contain a single object with location', () => {
      const query = `
        {
          Googlemaps {
            GooglemapsFindOne(filter:{where: {id: 1}}) {
              id
              location {
                lat
                lng
              }
            }
          }
        }`;
      return chai.request(server)
        .post('/graphql')
        .send({
          query,
        })
        .then((res) => {
          expect(res).to.have.status(200);
          const result = res.body.data;
          expect(result.Googlemaps.GooglemapsFindOne.location.lat).to.equal(10);
          expect(result.Googlemaps.GooglemapsFindOne.location.lng).to.equal(10);
        });
    });

    it('should have location distance of 486 miles', () => {
      const query = `
        {
          Googlemaps {
            GooglemapsFindOne(filter:{where: {id: 1}}) {
              id
              location {
                lat
                lng
                distance: distanceTo(point: {lat: 5, lng: 5})
              }
            }
          }
        }`;
      return chai.request(server)
        .post('/graphql')
        .send({
          query,
        })
        .then((res) => {
          expect(res).to.have.status(200);
          const result = res.body.data;
          expect(result.Googlemaps.GooglemapsFindOne.location.distance).to.equal(486.3956513042483);
        });
    });
  });
});
