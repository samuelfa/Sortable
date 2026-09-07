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

	const threshold = invertSwap
		? (typeof invertedSwapThreshold === "number" ? invertedSwapThreshold : swapThreshold)
		: swapThreshold;

	const thresholdOffset = (targetLength * (1 - threshold)) / 2;
	const isPastThresholdMin = mouseOnAxis >= targetS1 + thresholdOffset;
	const isPastThresholdMax = mouseOnAxis <= targetS2 - thresholdOffset;

	if (isPastThresholdMin && isPastThresholdMax) {
		let direction = 0;

		// Si se proveen índices explícitos (flujo dinámico de dragover)
		if (typeof dragIndex === 'number' && typeof targetIndex === 'number') {
			if (dragIndex < targetIndex) {
				direction = 1;
			} else if (dragIndex > targetIndex) {
				direction = -1;
			} else {
				direction = mouseOnAxis > middle ? 1 : -1;
			}
		} else {
			// Fallback para llamadas unitarias aisladas sin contexto de lista
			direction = mouseOnAxis > middle ? 1 : -1;
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
