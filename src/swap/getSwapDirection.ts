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
	isLastTarget: boolean
): number {
	const coords = getEventCoordinates(evt);
	if (!coords) return 0;

	const mouseOnAxis = vertical ? coords.y : coords.x;
	const targetLength = vertical ? targetRect.height : targetRect.width;
	const targetS1 = vertical ? targetRect.top : targetRect.left;
	const targetS2 = vertical ? targetRect.bottom : targetRect.right;
	const middle = targetS1 + targetLength / 2;

	const thresholdOffset = (targetLength * (1 - swapThreshold)) / 2;
	const isPastThresholdMin = mouseOnAxis >= targetS1 + thresholdOffset;
	const isPastThresholdMax = mouseOnAxis <= targetS2 - thresholdOffset;

	if (isPastThresholdMin && isPastThresholdMax) {
		const isAfter = mouseOnAxis > middle;
		let direction = isAfter ? 1 : -1;

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
