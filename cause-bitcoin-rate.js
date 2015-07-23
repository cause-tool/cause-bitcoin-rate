var _ = require('lodash');
var request = require('request');
var mout = require('mout');


function fn(task, step, input, prev_step, done) {
	// expects no input

	var cause = this;

	var req_opts = _.defaults(
		{
			url: 'https://api.bitcoinaverage.com/exchanges/'+step.options.exchange,
			json: true
		},
		cause.utils.scraping.request_defaults()
	);
	request(req_opts, function(err, res, body) {
		if (err) { return done(err); }

		if (res.statusCode != 200) {
			var message = 'status code: '+res.statusCode;
			cause.debug(message, task.name);
			cause.debug(req_opts.url);
			return done(new Error(message));
		}

		var market = body[step.options.market];
		var price = mout.object.get(market, 'rates.'+step.options.rate);
		if (!price) {
			var message = "couldn't retrieve price";
			cause.winston.error(message);
			console.log(market);
			return done(new Error(message));
		}
		
		cause.winston.info( cause.utils.format.price_delta(price, step.data.prev_price, task) );

		var output = price;
		var decision = didChange(price, step.data.prev_price);
		step.data.prev_price = price;
		cause.save();

		done(null, output, decision);
	}).on('error', function(err) {
		cause.handle_error(err);
	});
}


function didChange(current, previous) {
	return (current != previous);
}


module.exports = {
	didChange: didChange,
	fn: fn,

	defaults: {
		options: {
			exchange: 'EUR',
			market: 'bitcoin_de',
			rate: 'last'
		},
		data: {
			prev_price: 0
		},
		description: "฿ rate on\n<%=options.market%>"
	},
};
