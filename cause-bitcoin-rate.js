var _ = require('lodash');
var request = require('request');
var mout = require('mout');


function fn(task, step, input, prev_step, done) {
	// expects no input

	var cause = this;

	var req_opts = _.defaults(
		{
			url: 'https://api.bitcoinaverage.com/exchanges/EUR',
			json: true
		},
		cause.utils.scraping.request_defaults()
	);
	request(req_opts, function(err, res, body) {
		if (err) { return done(err); }

		if (res.statusCode != 200) {
			cause.debug('status code: '+res.statusCode, task.name);
			cause.debug(req_opts.url);
			return;
		}

		var market = body[step.options.market];
		var price = mout.object.get(market, 'rates.last');
		if (!price) {
			var message = "couldn't retrieve price";
			cause.winston.error(message);
			console.log(market);
			done(new Error(message));
			return;
		}
		
		cause.winston.info( cause.utils.format.price_delta(price, step.data.prev_price, task) );

		step.data.prev_price = price;
		cause.save();

		var output = price;
		done(null, output, null);
	});
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			market: 'bitcoin_de'
		},
		data: {
			prev_price: 0
		},
		description: "฿ rate on\n<%=options.market%>"
	},
};
