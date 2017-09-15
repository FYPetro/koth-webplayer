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
			this.dataScale = 1;
			this.hasBitmap = Boolean(renderer.getImageData);

			this.renderedMarks = new Map();

			if(this.hasBitmap) {
				window.devicePixelRatio = 1;
				this.canvas = docutil.make('canvas');
				this.canvas.width = 0;
				this.canvas.height = 0;
				this.context = this.canvas.getContext('2d');
			} else {
				this.canvas = {width: 0, height: 0};
			}
			this.boardClip = docutil.make('div', {'class': 'game-board-clip'}, [
				this.hasBitmap ? this.canvas : null,
			]);
			this.board = docutil.make('div', {'class': 'game-board'}, [this.boardClip]);

			this.boardClip.addEventListener('mousemove', (event) => {
				const bounds = this.boardClip.getBoundingClientRect();
				this.trigger('hover', [
					(event.clientX - bounds.left) / this.scaleX,
					(event.clientY - bounds.top) / this.scaleY,
				]);
			});

			this.boardClip.addEventListener('mouseleave', () => {
				this.trigger('hoveroff');
			});

			this.setScale(scaleX, scaleY);
		}

		_updateStyles() {
			const mx = this.scaleX / this.dataScale;
			const my = this.scaleY / this.dataScale;
			if(this.hasBitmap) {
				docutil.updateStyle(this.canvas, {
					'width': (this.canvas.width * mx) + 'px',
					'height': (this.canvas.height * my) + 'px',
				});
			}
			docutil.updateStyle(this.board, {
				'width': Math.round(this.canvas.width * mx) + 'px',
				'height': Math.round(this.canvas.height * my) + 'px',
			});
			docutil.updateStyle(this.boardClip, {
				'width': Math.round(this.canvas.width * mx) + 'px',
				'height': Math.round(this.canvas.height * my) + 'px',
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
				const x1 = Math.floor((mark.x + 0.5) * this.scaleX);
				const y1 = Math.floor((mark.y + 0.5) * this.scaleY);
				docutil.updateAttrs(dom.element, {
					'class': 'mark ' + (mark.className || ''),
				});
				if(typeof mark.content === 'string') {
					docutil.updateText(dom.text, mark.content);
					docutil.setParent(dom.textHold, dom.element);
				} else if(mark.content) {
					docutil.setParent(mark.content, dom.element);
				} else {
					docutil.empty(dom.element);
				}
				if(mark.toX !== null && mark.toY !== null) {
					// TODO: wrapping
					const x2 = Math.floor((mark.toX + 0.5) * this.scaleX);
					const y2 = Math.floor((mark.toY + 0.5) * this.scaleY);
					const l = Math.sqrt(
						(x2 - x1) * (x2 - x1) +
						(y2 - y1) * (y2 - y1)
					);
					docutil.updateStyle(dom.element, {
						'left': (x1 + x2 - l) * 0.5 + 'px',
						'top': (y1 + y2) * 0.5 + 'px',
						'transform': 'rotate(' + Math.atan2(
							y2 - y1,
							x2 - x1
						) + 'rad)',
						'width': l + 'px',
					});
				} else if(mark.w !== null && mark.h !== null) {
					// TODO: wrapping
					const x2 = Math.floor((mark.x + mark.w + 0.5) * this.scaleX);
					const y2 = Math.floor((mark.y + mark.h + 0.5) * this.scaleY);
					docutil.updateStyle(dom.element, {
						'left': x1 + 'px',
						'top': y1 + 'px',
						'width': (x2 - x1) + 'px',
						'height': (y2 - y1) + 'px',
					});
				} else {
					docutil.updateStyle(dom.element, {
						'left': x1 + 'px',
						'top': y1 + 'px',
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
			if(!this.hasBitmap) {
				const {width, height} = this.renderer.getSize();
				if(
					width !== this.canvas.width ||
					height !== this.canvas.height
				) {
					this.canvas.width = width;
					this.canvas.height = height;
					this._updateStyles();
				}
				this.rerender();
				return;
			}

			const data = this.renderer.getImageData();
			if(data) {
				const dataScale = this.renderer.scale || 1;
				if(
					data.width !== this.canvas.width ||
					data.height !== this.canvas.height ||
					dataScale !== this.dataScale
				) {
					this.canvas.width = data.width;
					this.canvas.height = data.height;
					this.dataScale = dataScale;
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
