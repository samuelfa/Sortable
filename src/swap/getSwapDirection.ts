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
	dragIndex?: number,
	targetIndex?: number
): number {
	const coords = getEventCoordinates(evt);
	if (!coords) return 0;

	const mouseOnAxis = vertical ? coords.y : coords.x;
	const targetLength = vertical ? targetRect.height : targetRect.width;
	const targetS1 = vertical ? targetRect.top : targetRect.left;
	const targetS2 = vertical ? targetRect.bottom : targetRect.right;
	const middle = targetS1 + targetLength / 2;

	if (invertSwap) {
		const invThreshold = typeof invertedSwapThreshold === "number" ? invertedSwapThreshold : 1;
		const thresholdOffset = (targetLength * invThreshold) / 2;
		
		if (mouseOnAxis < targetS1 + thresholdOffset) return -1;
		if (mouseOnAxis > targetS2 - thresholdOffset) return 1;
		return 0;
	}

	const thresholdOffset = (targetLength * (1 - swapThreshold)) / 2;
	const isPastThresholdMin = mouseOnAxis >= targetS1 + thresholdOffset;
	const isPastThresholdMax = mouseOnAxis <= targetS2 - thresholdOffset;

	if (isPastThresholdMin && isPastThresholdMax) {
		let direction = 0;

		if (typeof dragIndex === "number" && typeof targetIndex === "number") {
			if (dragIndex < targetIndex) {
				direction = 1;
			} else if (dragIndex > targetIndex) {
				direction = -1;
			} else {
				direction = mouseOnAxis > middle ? 1 : -1;
			}
		} else {
			// Fallback para tests unitarios aislados sin contexto de índices
			direction = mouseOnAxis > middle ? 1 : -1;
		}

		if (swapState) {
			swapState.setLastDirection(direction);
		}

		return direction;
	}

	return 0;
}
