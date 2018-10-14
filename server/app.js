const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const parseCookies = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(parseCookies);
app.use(Auth.createSession);

app.get('/', 
  (req, res) => {
    res.render('index');
  });

app.get('/create', 
  (req, res) => {
    res.render('index');
  });

app.get('/links', 
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links', 
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup', (req, res) => {
  return models.Users.create(req.body)
    .then((results) => {
      return models.Sessions.update({hash: req.session.hash}, {userId: results.insertId});
    })
    .then((results) => {
      res.redirect('/');
    })
    .catch((err) => {
      res.redirect('/signup');
    });
});

app.post('/login', (req, res) => {
  return models.Users.get({username: req.body.username})
    .then((userRow) => {
      if (userRow === undefined) {
        throw new Error('Username or Password Not Found');
      } else {
        req.user = userRow;
        var match = models.Users.compare(req.body.password, userRow.password, userRow.salt);
        return match;
      }
    })
    .then((match) => {
      if (match) {
        return models.Sessions.update({hash: req.session.hash}, {userId: req.user.id});
      } else {
        throw new Error('Username or Password Not Found');
      }  
    })
    .then((affectedRows) => {
      res.redirect('/');
    })
    .catch((err) => {
      res.redirect('/login');
    });

});

app.post('/logout', (req, res) => {
  return models.Sessions.delete({hash: req.cookies.shortlyid})
    .then((results) => {
      res.clearCookie('shortlyid');
      res.redirect('/');
    });
});


/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
