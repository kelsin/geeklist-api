const supertest = require('supertest');
const expect = require('chai').expect;
const app = require('../src/app');

describe("Authentication", function() {
  describe("with Authentication Token Set", function() {
    beforeEach(function() {
      process.env.AUTH_TOKEN = 'testing';
    });

    it("should reject requests with no Authorization header", function() {
      return supertest(app)
        .get('/admin')
        .expect(500)
        .then(response => {
          expect(response.body.error).to.equal("No Authorization Header");
        });
    });

    it("should reject requests with wrong Authorization header", function() {
      return supertest(app)
        .get('/admin')
        .set('Authorization', 'token testing1')
        .expect(500)
        .then(response => {
          expect(response.body.error).to.equal("Incorrect Authorization Token");
        });
    });

    it("should current Authorization header requests through", function() {
      return supertest(app)
        .get('/admin/not-found')
        .set('Authorization', 'token testing')
        .expect(404)
        .then(response => {
          expect(response.body.error).to.equal("Not Found");
        });
    });
  })

  describe("without Authentication Token Set", function() {
    beforeEach(function() {
      process.env.AUTH_TOKEN = '';
    });

    it("should reject requests", function() {
      return supertest(app)
        .get('/admin')
        .expect(500)
        .then(response => {
          expect(response.body.error).to.equal("No Authorization Token Set");
        });
    });
  })
});
