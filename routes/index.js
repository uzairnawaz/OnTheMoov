var express = require('express');
var router = express.Router();
var User = require('../models/user');

router.get('/', function (req, res, next) {
	return res.render('home.ejs');
});

router.get('/signup', function (req, res, next) {
	if (req.session.volunteer == true) {
		return res.redirect('/volunteer');
	} else if(req.session.unique_id != null) {
		return res.redirect('/user');
	}
	return res.render('signup.ejs');
});

router.post('/signup', function(req, res, next) {
	let personInfo = req.body;
	let isVolunteer = (req.body.userType === 'volunteer') ? true : false; 


	if(!personInfo.username || !personInfo.password || !personInfo.passwordConf){
		res.send();
	} else {
		if (personInfo.password == personInfo.passwordConf) {

			User.findOne({username:personInfo.username},function(err,data){
				if(!data){
					var c;
					User.findOne({},function(err,data){

						if (data) {
							c = data.unique_id + 1;
						}else{
							c=1;
						}
						var newPerson = new User({
							unique_id:c,
							username: personInfo.username,
							password: personInfo.password,
							passwordConf: personInfo.passwordConf,
							volunteer: isVolunteer,
							points: 0
						});

						newPerson.save(function(err, Person){
							if(err)
								console.log(err);
							else
								console.log('Success');
						});

					}).sort({_id: -1}).limit(1);
					res.send({"Success":"You are regestered,You can login now."});
				}else{
					res.send({"Success":"username is already used."});
				}
			});
		}else{
			res.send({"Success":"password is not matched"});
		}
	}
});

router.get('/login', function (req, res, next) {
	if (req.session.volunteer == true) {
		return res.redirect('/volunteer');
	} else if(req.session.unique_id != null) {
		return res.redirect('/user');
	}
	return res.render('login.ejs');
});


router.post('/login', function (req, res, next) {
	User.findOne({username:req.body.username},function(err,data){
		if(data){
			console.log('found login!');
			if(data.password==req.body.password){
				req.session.userId = data.unique_id;
				req.session.name = req.body.username;
				if (data.volunteer) {
					req.session.volunteer = true;
					res.send({"redirect":"/volunteer", "Success": true})
				} else {
					req.session.volunteer = false;
					res.send({"redirect":"/user", "Success": true});
				}
			}else{
				res.send({"Success":"Wrong password!"});
			}
		}else{
			res.send({"Success":"This username Is not regestered!"});
		}
	});
});

router.get('/logout', function (req, res, next) {
	console.log("logout")
	if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
    	if (err) {
    		return next(err);
    	} else {
    		return res.redirect('/');
    	}
    });
}
});

//volunteer routes
router.get('/volunteer', function (req, res, next) {
	if (!req.session.volunteer || req.session.volunteer == undefined) {
		return res.render('error.ejs');
	}
	
	User.find({}, function(err, data) {
		let allRequests = [];
		for (let i = 0; i < data.length; i++) {
			for (let j = 0; j < data[i].requests.length; j++) {
				if (!data[i].volunteer) {
					allRequests.push(data[i].requests[j]);
				}
			}
		}
		return res.render('volunteer.ejs', {infos: allRequests, name: req.session.name});

	});
});

router.get('/volunteer/dashboard', function(req, res, next) {
	if (!req.session.volunteer || req.session.volunteer == undefined) {
		return res.render('error.ejs');
	}

	User.findOne({unique_id: req.session.userId}, function(err, data) {
		console.log("WHYYY");
		console.log(data.requests);
		return res.render('volunteerDashboard.ejs', {infos: data.requests, name: req.session.name});
	})

})

router.post('/volunteer/slot', function(req, res) {
	if (!req.session.volunteer || req.session.volunteer == undefined) {
		return res.render('error.ejs');
	}
	let eventId = req.body.id;
	let startStr = req.body.startStr;
	let endStr = req.body.endStr;
	let userId = req.session.userId;
	let name = req.body.name;
	let rName = req.session.name;
	let from = req.body.from;
	let to = req.body.to;

	console.log('name : ' + name);
	//slot it
	User.findOne({username: name}, function(err, data) {
		console.log(data)
		for (let i = 0; i < data.requests.length; i++) {
			if (data.requests[i]._id != null && data.requests[i]._id.toString() == eventId) {
				console.log(data.requests[i]);
				data.requests[i].slotted = true;
				break;
			}
		}
		data.save(function(err) {
			if (!err) {
				console.log("Success!");
			}else {
				console.log(err);
			}
		});
	})
	//add to volunteer's dashboard
	User.findOne({unique_id:userId},function(err,data){
		reqs = {};
		reqs["_id"]=eventId;
		reqs["name"] = name;
		reqs["startTime"] = startStr;
		reqs["endTime"] = endStr;
		reqs["fromPlace"] = from;
		reqs["toPlace"] = to;
		reqs["slotted"] = true;
		data.requests.push(reqs);
		
		data.points++;
		data.save(function(error) {
			if (!error) {
				console.log('success!');
			}
		})		
	});

})

router.get('/volunteer/ranking', function(req, res) {
	User.find({}, function(err, data) {
		console.log(data);
		let resu = [];
		for (let i = 0; i < data.length; i++) {
			if (data[i].volunteer) {
				resu.push({name: data[i].username, point: data[i].points});
			}
		}
		console.log('hi');
		console.log(resu);
		return res.render("ranking.ejs", {ranks: resu});
	});
});

router.post('/volunteer/revertEvent', function(req, res) {
	let eventId = req.body.id;
	let startStr = req.body.startStr;
	let endStr = req.body.endStr;
	let userId = req.session.userId;
	let name = req.body.name;
	let rName = req.session.name;
	let from = req.body.from;
	let to = req.body.to;
	
	User.findOne({unique_id: userId}, function(err, data) {
		let res = [];
		for (let i = 0; i < data.requests.length; i++) {
			if (data.requests[i]._id.toString() != eventId) {
				res.push(data.requests[i]);
			}
		}
		data.requests = res;
		data.points--;

		data.save(function(err) {
			console.log('success')
		})
	})

	//set slotted = false in user's
	User.findOne({username: name}, function(err, data) {
		for (let i = 0; i < data.requests.length; i++) {
			console.log("Comparing : " + data.requests[i]._id.toString() + " : " + eventId);
			if (data.requests[i]._id.toString() === eventId) {
				data.requests[i].slotted = false;
				console.log('reached');
				break;
			}
		}
		console.log('???')

		data.save(function(err) {
			console.log('success1')
		})
	})

	return res.send({"success":true})
})

//user routes
router.post('/user', function(req, res) {
	let source = req.body.from; 
	let dest = req.body.to; 
	
	res.redirect('/user'); 
	
}); 

router.get('/user', function (req, res, next) {
	if (req.session.volunteer || req.session.volunteer == undefined) {
		return res.render('error.ejs');
	}

	User.findOne({unique_id: req.session.userId}, function(err, data) {
		console.log(data.requests);
		return res.render('user.ejs', {infos: data.requests, name: req.session.name});
	})
});

router.post('/usr/deleteEvent', function(req, res, next) {
	// console.log('deted');
	console.log(req.body);
	let eventId = req.body.id;
	let name = req.body.name;
	let slotted = req.body.slotted;
	User.findOne({unique_id: req.session.userId}, function(err, data) {
		console.log(data);
		console.log('deleting : ' + eventId);
		rqs = [];
		for (let i = 0; i < data.requests.length; i++) {
			if (data.requests[i]._id != null && data.requests[i]._id.toString() != eventId) {
				rqs.push(data.requests[i]);
			}
		}
		data.requests = rqs;
		data.save(function(err) {
			if (!err) {
				console.log("Success!");
			}else {
				console.log(err);
			}
		});
	})

	if (slotted) {
		console.log('it is already slotted');
		User.find({}, function(err, data) {
			let res = []
			for (let i = 0; i < data.length; i++) {
				if (data[i].volunteer == true) {
					for (let j = 0; j < data[i].requests.length; j++) {
						if (data[i].requests[j]._id != eventId) {
							res.push(data[i].requests[j]);
							console.log(data[i].requests[j]);
							console.log("FOUND THE SLOTTED PERSON : " + data[i].requests[j].name);
						}else {
							data[i].points--;
						}
					}
				}
				data[i].requests = res;
				data[i].save(function(err) {
					console.log('sc1');
				})
			}

			
		})

		return res.send({"success":true});

	}
})

router.post('/usr/addEvent', async function(req, res, next) {
	console.log('jesus');
	console.log(req.body);
	let startStr = req.body.startStr;
	let endStr = req.body.endStr;
	let userId = req.session.userId;
	let name = req.session.name;
	let from = req.body.from;
	let to = req.body.to;
	User.findOne({unique_id:userId},function(err,data){
		console.log("FOUND ");
		console.log(data);
		
		// {
		// 	name: String,
		// 	startTime: String,
		// 	endTime: String,
		// 	fromPlace: String,
		// 	toPlcae: String
		// }
		reqs = {};
		reqs["name"] = name;
		reqs["startTime"] = startStr;
		reqs["endTime"] = endStr;
		reqs["fromPlace"] = from;
		reqs["toPlace"] = to;
		reqs["slotted"] = false;
		data.requests.push(reqs);
		
		
		data.save(function(error) {
			if (!error) {
				console.log('success!');
			}
		})		
		return res.send({"success":true});
	});



});



module.exports = router;