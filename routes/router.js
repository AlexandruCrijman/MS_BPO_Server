const express = require('express');
const router = express.Router();
const fs = require('fs');
const request = require('request');
const db = require('../models');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Mobile Banking' });
});

router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Mobile Banking - Register' });
});

router.get('/validating', function(req, res, next) {
  res.render('validating', { title: 'Mobile Banking - Validating' });
});

router.get('/dashboard', function(req, res, next) {
  res.render('dashboard', { title: 'Mobile Banking - Dashboard' });
});

router.get('/fail', function(req, res, next) {
  res.render('fail', { title: 'Mobile Banking - Failed to create account' });
});

router.get('/success', function(req, res, next) {
  res.render('success', { title: 'Mobile Banking - Success' });
});

router.get('/approval/:email', function(req, res, next) {
  const email = req.params.email;
  db.User.findOne({
    where: {
      email: email
    }
  }).then(user => {
    if (user == null) {
      return res.sendStatus(404);
    } else {
      return res.render('approval', { title: 'Mobile Banking - Approve user', user: user });
    }
  }).catch((err) => {
    console.log('***There was an error retrieving the user', JSON.stringify(user))
    return res.status(400).send(err)
  });
});

router.get('/api/users/:email', function(req, res, next) {
  const email = req.params.email;
  db.User.findOne({
    where: {
      email: email
    }
  }).then(user => {
    if (user == null) {
      return res.sendStatus(404);
    } else {
      return res.status(200).json({user: user});
    }
  }).catch((err) => {
    console.log('***There was an error retrieving the user', JSON.stringify(user))
    return res.status(400).send(err)
  });
});

// FOR TESTING PURPOSES ONLY
router.get('/api/users/delete/:email', function(req, res, next) {
  const email = req.params.email;
  db.User.findOne({
    where: {
      email: email
    }
  }).then(user => {
    if (user == null) {
      return res.sendStatus(404);
    } else {
      user.destroy();
      return res.sendStatus(200);
    }
  }).catch((err) => {
    console.log('***There was an error retrieving the user', JSON.stringify(user))
    return res.status(400).send(err)
  });
});

router.post('/api/users/activate/:email', function(req, res, next) {
  const email = req.params.email;
  db.User.findOne({
    where: {
      email: email
    }
  }).then(user => {
    if (user != null) {
      user.update({ active: true })
      .then(() => res.sendStatus(200))
      .catch((err) => {
        console.log('***Error updating user', JSON.stringify(err))
        res.status(400).send(err)
      });
    }
  }).catch((err) => {
    console.log('***There was an error retrieving the user', JSON.stringify(user))
    return res.status(400).send(err)
  });
});

router.post('/api/users/deactivate/:email', function(req, res, next) {
  const email = req.params.email;
  db.User.findOne({
    where: {
      email: email
    }
  }).then(user => {
    if (user != null) {
      user.update({ active: false })
      .then(() => res.sendStatus(200))
      .catch((err) => {
        console.log('***Error updating user', JSON.stringify(err))
        res.status(400).send(err)
      });
    }
  }).catch((err) => {
    console.log('***There was an error retrieving the user', JSON.stringify(user))
    return res.status(400).send(err)
  });
});

router.post('/api/users/add-image/:email', function(req, res, next) {
  const email = req.params.email;
  db.User.findOne({
    where: {
      email: email
    }
  }).then(user => {
    if (user != null) {
      var data = req.body.img;
      fs.writeFile('public/accounts/' + email + '/processed.jpg', data, {encoding: 'base64'}, function (err) {
        if (err) throw err;
        console.log('Saved processed image to disk.');
        res.sendStatus(200);
      });
    }
  }).catch((err) => {
    console.log('***There was an error retrieving the user', JSON.stringify(user))
    return res.status(400).send(err)
  });
});

router.post('/register', function(req, res, next) {
  var json = Object.assign({}, req.body);
  delete json.id;
  delete json.selfie;
  var id = req.body.id.split('base64,')[1];
  var selfie = req.body.selfie.split('base64,')[1];
  console.log(json);
  if (!fs.existsSync('public/accounts/' + req.body.email)) {
    fs.mkdirSync('public/accounts/' + req.body.email);
  }
  fs.writeFile('public/accounts/' + req.body.email + '/account-info.json', JSON.stringify(json), function (err) {
    if (err) throw err;
    console.log('Saved account info to file.');
  });
  fs.writeFile('public/accounts/' + req.body.email + '/id.jpg', id, {encoding: 'base64'}, function (err) {
    if (err) throw err;
    console.log('Saved id image to disk.');
  });
  fs.writeFile('public/accounts/' + req.body.email + '/selfie.jpg', selfie, {encoding: 'base64'}, function (err) {
    if (err) throw err;
    console.log('Saved selfie image to disk.');
  });

  // Delete user from db if it exists
  db.User.findOne({
    where: {
      email: req.body.email
    }
  }).then((user) => {
    user.destroy().then(() => {
      // Create user in db
      db.User.findOrCreate({
        where: {
          email: req.body.email
        },
        defaults: json
      }).then(([user, created]) => {
        if (created) {
          console.log('Created user in db.');
        }
      }).catch((err) => {
        console.log('***There was an error creating the user', JSON.stringify(user))
        return res.status(400).send(err)
      });
    });
  }).catch((err) => {
    console.log('***No existing user found in db. ' + err);
    // Create user in db
    db.User.findOrCreate({
      where: {
        email: req.body.email
      },
      defaults: json
    }).then(([user, created]) => {
      if (created) {
        console.log('Created user in db.');
      }
    }).catch((err) => {
      console.log('***There was an error creating the user', JSON.stringify(user))
      return res.status(400).send(err)
    });
  });

  // Authenticate
  const Orchestrator_URL = 'https://immersionlabs-1.azurewebsites.net/';

  request.post(Orchestrator_URL + '/api/Account/Authenticate', {
    json: {
      "tenancyName": "default",
      "usernameOrEmailAddress": "GeneralRobot",
      "password": "ft6&YGhu8(IJ"
    }
  }, (error, res, body) => {
    if (error) {
      console.error(error)
      return
    }
    if (res.statusCode == 200) {
      var token = body.result;

      var options = {
        url: Orchestrator_URL + '/odata/Queues/UiPathODataSvc.AddQueueItem',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        json: {
          "itemData": {
              "Name": "MobileBankingBO",
              "Priority": "Normal",
              "SpecificContent": {
                  "Info": JSON.stringify(json)
              }
          }
        }
      };
    
      request(options, (error, res, body) => {
        if (error) {
          console.error(error)
          return
        }
        if (res.statusCode == 201) {
          console.log('Orchestrator Queue Item created.')
        }
      })
    }
  })

  res.status(200).json({status: "success"})
});


module.exports = router;
