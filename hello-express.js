var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var User = require('./user');
var jwt = require('jsonwebtoken');
var superSecret = 'DyW88PrSDpLyqDDuORdlCyYL7ZZ99KmPUSPxQTWoqJUo3U4IaLOhJHphbr026gEF';

mongoose.connect('mongodb://localhost:27017/instagram');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/name/:name', function(req, res){
  console.log(req.params);
  console.log(req.query);
  var name = req.params.name;
  res.send('Hello world from express ' + name);
});

app.get('/sum/:n1/:n2', function(req, res){
  console.log(req.params.n1 + req.params.n2);
  res.send("OK");
});

var router1 = express.Router();
router1.route('/rest')
.get(function(res, res){
  res.json({type: 'THIS IS GET'});
})
.post(function(req, res){
  //Simular login
  console.log(req.body);
  console.log(req.body.username)
  res.json({type: 'THIS IS POST'});
})
.put(function(req, res){
  res.json({type: 'THIS IS PUT'});
})
.delete(function(req, res){
  res.json({type: 'THIS IS DELETE'});
})

app.use('/', router1);
app.post('/register', function(req, res){
  var newUser = User();
  newUser.email = req.body.email;
  newUser.username = req.body.username;
  newUser.name = req.body.name;
  newUser.password = req.body.password;
  console.log(newUser);
  newUser.save(function(err) {
            if (err) {
                //Duplicate entry
                if (err.code == 11000)
                    return res.json({
                        success: false,
                        message: 'A user with that username already exists. '
                    });
                else
                    return res.json({
                        success: false,
                        message: 'Something goes wrong! Try later. '
                    });
            }
            //Return a message
            res.json({success: true,
                message: 'User created succesfully.'
            });
        });
})

app.post('/login', function(req, res) {
        //Find the user
        User.findOne({
            username: req.body.username
        }).select('name username password').exec(function(err, user) {
            if (err) throw err;
            //No user with that username was found
            if (!user) {
                res.json({
                    success: false,
                    message: 'Invalid username or password'
                });
            } else if (user) {
                //Check if password matches
                var validPassword = user.comparePassword(req.body.password);
                if (!validPassword) {
                    res.json({
                        success: false,
                        message: 'Invalid username or password'
                    });
                } else {
                    //If user is found and password is right create Token
                    var token = jwt.sign({
                        id: user._id,
                        username: user.username
                    }, superSecret, {
                        //Expires in 24 hours
                        expiresIn: 60 * 60 * 24
                    });
                    //Return the information including token as JSON
                    res.json({
                        success: true,
                        message: 'Login Succesful',
                        token: token,
                        id: user._id,
                        username : user.username
                    });
                }
            }
        });
    });

app.use(function(req, res, next){
    //Check header or url parameters or post parameters for token
	  var token = req.body.token || req.query.token || req.headers['x-access-token'];
	  //Decode token
	  if (token) {
	    //Verifies secret and checks exp
	    jwt.verify(token, superSecret, function(err, decoded) {
	      if (err) {
	        res.status(403).send({
	        	success: false,
	        	message: 'Failed to authenticate token.'
	    	});
	      } else {
	        //If everything is good, save to request for use in other routes
	        req.decoded = decoded;
           //Make sure we go to the next routes and don't stop here
	        next();
	      }
	    });
	  } else {
	    //If there is no token
	    //Return an HTTP response of 403 (access forbidden) and an error message
   	 	res.status(403).send({
   	 		success: false,
   	 		message: 'No token provided.'
   	 	});
	  }
  });

  app.get('/me', function(req, res){
    res.json(req.decoded);
  })

app.listen(3000);
