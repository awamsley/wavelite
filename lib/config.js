'use strict';

module.exports = (processArgs) => {
	const CONFIG_FILE = processArgs[0] || null;
	if (CONFIG_FILE === null) {
		console.log('MISSING CONFIG FILE ARGUMENT');
		process.exit(1);
	}

	const PORT = processArgs[1] || null;
	if (PORT === null || !(parseInt(PORT) > 0)) {
		console.log('MISSING PORT ARGUMENT');
		process.exit(1);
	}

	const path = require('path');
	const jsonConfig = require(path.join(`${__dirname}/../${CONFIG_FILE}`));

	const requiredConfigs = ['initialText', 'appId', 'url'];
	for (const testConfig of requiredConfigs) {
		if (!jsonConfig[testConfig]) {
			console.error(`Missing config value: ${testConfig}`);
			process.exit(1);
		}
	}

	return {
		PORT: PORT,
		CONFIG_FILE: CONFIG_FILE,
		MQTT_CONFIG: {
			BASE_ID: `${jsonConfig.appId}_${PORT}`,
			NAMESPACE: jsonConfig.appId,
			URL: jsonConfig.url,
			INIT_TEXT: jsonConfig.initialText
		}
	};
};