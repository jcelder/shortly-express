const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // var session = {};
  // if (!req.cookies || !Object.keys(req.cookies).length) {
  //   return models.Sessions.create()
  //     .then((results) => {
  //       return models.Sessions.get({id: results.insertId});
  //     })
  //     .then((row) => {
  //       session.hash = row.hash;
  //       req.session = session;
  //     })
  //     .then(() => {
  //       res.cookie('shortlyid', session.hash);
  //       next();
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       next();
  //     });   
  // } else if (req.cookies.shortlyid) {
  //   session.hash = req.cookies.shortlyid;
  //   return models.Sessions.get({hash: session.hash})
  //     .then((row) => {
  //       session = row;
  //       req.session = session;
  //       next();
  //     })
  //     .catch((err) => {
  //       res.cookie('shortlyid', '');
  //       next();
  //     });
  // }

  // check if req.cookies exists
  Promise.resolve(req.cookies)
    .then((hash) => {
      // check if req.cookies has a hash
      if (!hash) {
        // if it doesn't, create a session
        throw new Error('No hash');
      }
      return models.Sessions.get({hash});
    })
    .then((session) => {
      // check if the hash corresponds to a session
      if (!session) {
        // if it doesn't, create a session
        throw new Error('No session');
      }
      return session;
    })
    .catch((err) => {
      return models.Sessions.create()
        .then(results => {
          return models.Sessions.get({id: results.insertId});
        })
        .then(session => {
          res.cookie('shortlyid', session.hash);
          return session;
        });
    })
    .then((session) => {
      req.session = session;
      next();
    });
  // assign session property to object
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

