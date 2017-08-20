define(['math/Random'], (Random) => {
	'use strict';

	return (GameManager) => {
		let game = null;
		let time0 = null;

		function sendState() {
			const now = performance.now();
			const state = game.getState();
			self.postMessage({
				action: 'STEP_COMPLETE',
				state: Object.assign({}, state, {
					realWorldTime: now - time0,
				}),
			});
		}

		self.addEventListener('message', (event) => {
			const data = event.data;

			switch(data.action) {
			case 'BEGIN':
				if(game != null) {
					throw 'Cannot re-use game worker';
				}
				time0 = performance.now();
				game = new GameManager(new Random(data.config.seed), data.config);
				sendState();
				break;

			case 'STEP':
				for(let i = 0; i < data.steps; ++ i) {
					game.step(data.type);
				}
				sendState();
				break;

			case 'UPDATE_CONFIG':
				game.updateConfig(data.config);
				break;
			}
		});
	};
});