const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // access req.cookies
    // look up userdata related to session
    // assign that userdata to a req.session object
      // user_id, sessionId, username
  // if no cookies
    // create a session
    // and set cookie in header session id
  // if cookie
    // verify valid cookie
  var session = {};
    if (!req.cookies || !Object.keys(req.cookies).length) {
      return models.Sessions.create()
        .then((results) => {
          return models.Sessions.get({id: results.insertId})
        })
        .then((row) => {
          session.hash = row.hash;
          req.session = session;
        })
        .then(() => {
          res.cookie('shortlyid', session.hash)
          next();
        })
        .catch((err) => {
          console.log(err);
          next();
        })   
    } else if (req.cookies.shortlyid) {
      session.hash = req.cookies.shortlyid;
      return models.Sessions.get({hash: session.hash})
        .then((row) => {
          session = row;
          req.session = session;
          next();
        })
        .catch((err) => {
          res.cookie('shortlyid', '');
          next();
        })
    }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

