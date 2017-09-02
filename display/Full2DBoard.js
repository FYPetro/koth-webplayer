define([
	'core/EventObject',
	'./documentUtils',
	'./style.css',
], (
	EventObject,
	docutil
) => {
	'use strict';

	const EMPTY_MAP = new Map();

	return class Full2DBoard extends EventObject {
		constructor({renderer, markerStore = null, scaleX = 1, scaleY = null}) {
			super();

			this.renderer = renderer;
			this.markerStore = markerStore;
			this.scaleX = 0;
			this.scaleY = 0;

			this.renderedMarks = new Map();

			window.devicePixelRatio = 1;
			this.canvas = docutil.make('canvas');
			this.canvas.width = 0;
			this.canvas.height = 0;
			this.boardClip = docutil.make('div', {'class': 'game-board-clip'}, [this.canvas]);
			this.board = docutil.make('div', {'class': 'game-board'}, [this.boardClip]);

			this.context = this.canvas.getContext('2d');
			this.setScale(scaleX, scaleY);
		}

		_updateStyles() {
			docutil.updateStyle(this.canvas, {
				'width': (this.canvas.width * this.scaleX) + 'px',
				'height': (this.canvas.height * this.scaleY) + 'px',
			});
			docutil.updateStyle(this.board, {
				'width': Math.round(this.canvas.width * this.scaleX) + 'px',
				'height': Math.round(this.canvas.height * this.scaleY) + 'px',
			});
			docutil.updateStyle(this.boardClip, {
				'width': Math.round(this.canvas.width * this.scaleX) + 'px',
				'height': Math.round(this.canvas.height * this.scaleY) + 'px',
			});
		}

		rerender() {
			const markers = this.markerStore ? this.markerStore.marks : EMPTY_MAP;

			markers.forEach((mark, key) => {
				let dom = this.renderedMarks.get(key);
				if(!dom) {
					dom = {
						element: docutil.make('div'),
						textHold: docutil.make('span'),
						text: docutil.text(),
					};
					dom.textHold.appendChild(dom.text);
					this.renderedMarks.set(key, dom);
				}
				const x1 = Math.round((mark.x + 0.5) * this.scaleX);
				const y1 = Math.round((mark.y + 0.5) * this.scaleY);
				docutil.updateAttrs(dom.element, {
					'class': 'mark ' + (mark.className || ''),
				});
				docutil.updateStyle(dom.element, {
					'left': x1 + 'px',
					'top': y1 + 'px',
				});
				if(typeof mark.content === 'string') {
					docutil.updateText(dom.text, mark.content);
					docutil.setParent(dom.textHold, dom.element);
				} else if(mark.content) {
					docutil.setParent(mark.content, dom.element);
				} else {
					docutil.empty(dom.element);
				}
				if(mark.w !== null && mark.h !== null) {
					// TODO: wrapping
					const x2 = Math.round((mark.x + mark.w) * this.scaleX);
					const y2 = Math.round((mark.y + mark.h) * this.scaleY);
					docutil.updateStyle(dom.element, {
						'width': (x2 - x1) + 'px',
						'height': (y2 - y1) + 'px',
					});
				}
				docutil.setParent(dom.element, mark.clip ? this.boardClip : this.board);
			});

			this.renderedMarks.forEach((dom, key) => {
				if(!markers.has(key)) {
					docutil.setParent(dom.element, null);
					this.renderedMarks.delete(key);
				}
			});
		}

		repaint() {
			const data = this.renderer.getImageData();
			if(data) {
				if(
					data.width !== this.canvas.width ||
					data.height !== this.canvas.height
				) {
					this.canvas.width = data.width;
					this.canvas.height = data.height;
					this._updateStyles();
				}
				this.context.putImageData(data, 0, 0);
			}

			this.rerender();
		}

		setMarkerStore(markerStore) {
			this.markerStore = markerStore;
		}

		setScale(x, y = null) {
			if(y === null) {
				y = x;
			}
			if(this.scaleX !== x || this.scaleY !== y) {
				this.scaleX = x;
				this.scaleY = y;
				this._updateStyles();
			}
		}

		dom() {
			return this.board;
		}
	};
});
