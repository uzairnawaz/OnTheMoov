var mongoose = require('mongoose');
var Schema = mongoose.Schema;

userSchema = new Schema( {
	unique_id: Number,
	username: String,
	password: String,
	passwordConf: String,
	volunteer: Boolean,
	requests: [
		{
			name: String,
			startTime: String,
			endTime: String,
			fromPlace: String,
			toPlace: String,
			slotted: Boolean,
		}
	]
}),
User = mongoose.model('User', userSchema);

module.exports = User;