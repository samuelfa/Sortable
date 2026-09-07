import { getEventCoordinates } from "../geometry/coordinates";
import { swapState } from "../state/SwapState";

export function getSwapDirection(
	evt: any,
	target: HTMLElement,
	targetRect: DOMRect,
	vertical: boolean,
	swapThreshold: number,
	invertedSwapThreshold: number,
	invertSwap: boolean,
	isLastTarget: boolean,
	dragIndex: number,
	targetIndex: number
): number {
	const coords = getEventCoordinates(evt);
	if (!coords) return 0;

	const mouseOnAxis = vertical ? coords.y : coords.x;
	const targetLength = vertical ? targetRect.height : targetRect.width;
	const targetS1 = vertical ? targetRect.top : targetRect.left;
	const targetS2 = vertical ? targetRect.bottom : targetRect.right;

	const thresholdOffset = (targetLength * (1 - swapThreshold)) / 2;
	const isPastThresholdMin = mouseOnAxis >= targetS1 + thresholdOffset;
	const isPastThresholdMax = mouseOnAxis <= targetS2 - thresholdOffset;

	// Mouse is within active swap zone (e.g., 20% to 80%)
	if (isPastThresholdMin && isPastThresholdMax) {
		let direction = 0;

		if (dragIndex < targetIndex) {
			// Moving downward: crossing top threshold triggers insert AFTER
			direction = 1;
		} else if (dragIndex > targetIndex) {
			// Moving upward: crossing bottom threshold triggers insert BEFORE
			direction = -1;
		}

		if (invertSwap) {
			direction *= -1;
		}

		if (swapState) {
			swapState.setLastDirection(direction);
		}

		return direction;
	}

	return 0;
}
