'use strict';

const _ = require('lodash');
const request = require('request');
const mout = require('mout');
const scrapingUtils = require('cause-utils/scraping');
const formattingUtils = require('cause-utils/formatting');


function main(step, context, config, input, done) {
	// expects no input

	const reqOpts = _.defaults(
		{
			url: `https://api.bitcoinaverage.com/exchanges/${config.exchange}`,
			json: true
		},
		scrapingUtils.requestDefaults()
	);
	request(reqOpts, (err, res, body) => {
		if (err) { return done(err); }

		if (res.statusCode !== 200) {
			const message = `status code: ${res.statusCode}`;
			context.debug(message, context.task.name);
			context.debug(reqOpts.url);
			return done(new Error(message));
		}

		const path = [config.market, 'rates', config.rate];
		const price = mout.object.get(body, path.join('.'));
		if (!price) {
			const message = "couldn't retrieve price";
			context.debug(message, context.task.name);
			return done(new Error(message));
		}

		context.logger.info(
			formattingUtils.priceDelta(price, step.data.prevPrice, context.task)
		);

		const output = price;
		const decision = didChange(price, step.data.prevPrice);
		step.data.prevPrice = price;
		context.saveTask();

		done(null, output, decision);
	})
	.on('error', (err) => {
		done(err);
	});
}


function didChange(current, previous) {
	return (current !== previous);
}


module.exports = {
	didChange: didChange,
	main: main,

	defaults: {
		config: {
			exchange: 'EUR',
			market: 'bitcoin_de',
			rate: 'last'
		},
		data: {
			prevPrice: 0
		},
		description: '฿ rate on\n<%=config.market%>'
	},
};
