import { getRect, css, matrix, isRectEqual, indexOfObject } from './utils.js';
import type { Sortable } from './Sortable.js';

interface AnimationState {
	target: HTMLElement;
	rect: DOMRect;
	fromRect?: DOMRect;
	toRect?: DOMRect;
	prevFromRect?: DOMRect;
	prevToRect?: DOMRect;
	thisAnimationDuration?: number;
	animationResetTimer?: ReturnType<typeof setTimeout>;
	animated?: number | boolean;
	animatingX?: boolean;
	animatingY?: boolean;
	fromRect?: DOMRect;
}

export default function AnimationStateManager(): {
	captureAnimationState: () => void;
	addAnimationState: (state: AnimationState) => void;
	removeAnimationState: (target: HTMLElement) => void;
	animateAll: (callback?: () => void) => void;
	animate: (target: HTMLElement, currentRect: DOMRect, toRect: DOMRect, duration: number) => void;
} {
	let animationStates: AnimationState[] = [];
	let animationCallbackId: ReturnType<typeof setTimeout> | null = null;

	return {
		captureAnimationState() {
			animationStates = [];
			if (!this.options?.animation) return;
			const children = Array.from(this.el.children);

			children.forEach((child: HTMLElement) => {
				if (css(child, 'display') === 'none' || child === Sortable.ghost) return;
				animationStates.push({
					target: child,
					rect: getRect(child, false, false, false, undefined),
				});
				const fromRect = { ...animationStates[animationStates.length - 1].rect };

				if (child.thisAnimationDuration) {
					const childMatrix = matrix(child, true);
					if (childMatrix) {
						fromRect.top -= childMatrix.f;
						fromRect.left -= childMatrix.e;
					}
				}

				child.fromRect = fromRect;
			});
		},

		addAnimationState(state: AnimationState): void {
			animationStates.push(state);
		},

		removeAnimationState(target: HTMLElement): void {
			const idx = indexOfObject(animationStates, { target });
			if (idx >= 0) animationStates.splice(idx, 1);
		},

		animateAll(callback?: () => void): void {
			if (!this.options?.animation) {
				if (animationCallbackId) clearTimeout(animationCallbackId);
				if (typeof callback === 'function') callback();
				return;
			}

			let animating = false;
			let animationTime = 0;

			animationStates.forEach((state) => {
				let time = 0;
				let animatingThis = false;
				const target = state.target;
				const fromRect = target.fromRect;
				const toRect = getRect(target, false, false, false, undefined);
				const prevFromRect = target.prevFromRect;
				const prevToRect = target.prevToRect;
				const animatingRect = state.rect;
				const targetMatrix = matrix(target, true);

				if (targetMatrix) {
					toRect.top -= targetMatrix.f;
					toRect.left -= targetMatrix.e;
				}

				target.toRect = toRect;

				if (target.thisAnimationDuration) {
					if (
						isRectEqual(prevFromRect, toRect) &&
						!isRectEqual(fromRect, toRect) &&
						(animatingRect.top - toRect.top) /
							(animatingRect.left - toRect.left) ===
							(fromRect.top - toRect.top) / (fromRect.left - toRect.left)
					) {
						time = calculateRealTime(animatingRect, prevFromRect, prevToRect, this.options);
					}
				}

				if (!isRectEqual(toRect, fromRect)) {
					target.prevFromRect = fromRect;
					target.prevToRect = toRect;

					if (!time) {
						time = this.options.animation;
					}
					this.animate(target, animatingRect, toRect, time);
				}

				if (time) {
					animating = true;
					animationTime = Math.max(animationTime, time);
					clearTimeout(target.animationResetTimer);
					target.animationResetTimer = setTimeout(() => {
						target.animationTime = 0;
						target.prevFromRect = null;
						target.fromRect = null;
						target.prevToRect = null;
						target.thisAnimationDuration = null;
					}, time);
					target.thisAnimationDuration = time;
				}
			});

			if (animationCallbackId) clearTimeout(animationCallbackId);
			if (!animating) {
				if (typeof callback === 'function') callback();
			} else {
				animationCallbackId = setTimeout(() => {
					if (typeof callback === 'function') callback();
				}, animationTime);
			}
			animationStates = [];
		},

		animate(target: HTMLElement, currentRect: DOMRect, toRect: DOMRect, duration: number): void {
			if (duration) {
				css(target, 'transition', '');
				css(target, 'transform', '');
				const elMatrix = matrix(this.el);
				const scaleX = elMatrix && elMatrix.a;
				const scaleY = elMatrix && elMatrix.d;
				const translateX = (currentRect.left - toRect.left) / (scaleX || 1);
				const translateY = (currentRect.top - toRect.top) / (scaleY || 1);

				target.animatingX = !!translateX;
				target.animatingY = !!translateY;

				css(target, 'transform', `translate3d(${translateX}px,${translateY}px,0)`);

				this.forRepaintDummy = repaint(target);

				css(
					target,
					'transition',
					'transform ' +
						duration +
						'ms' +
						(this.options.easing ? ' ' + this.options.easing : '')
				);
				css(target, 'transform', 'translate3d(0,0,0)');
				if (typeof target.animated === 'number') clearTimeout(target.animated);
				target.animated = setTimeout(() => {
					css(target, 'transition', '');
					css(target, 'transform', '');
					target.animated = false;

					target.animatingX = false;
					target.animatingY = false;
				}, duration);
			}
		},
	};
}

function repaint(target: HTMLElement): number {
	return target.offsetWidth;
}

function calculateRealTime(
	animatingRect: DOMRect,
	fromRect: DOMRect,
	toRect: DOMRect,
	options: { animation: number }
): number {
	return (
		(Math.sqrt(
			Math.pow(fromRect.top - animatingRect.top, 2) +
				Math.pow(fromRect.left - animatingRect.left, 2)
		) /
			Math.sqrt(
				Math.pow(fromRect.top - toRect.top, 2) +
					Math.pow(fromRect.left - toRect.left, 2)
			)) *
		options.animation
	);
}