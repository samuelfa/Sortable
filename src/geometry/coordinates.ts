export interface EventCoordinates {
	x: number;
	y: number;
}

export function getEventCoordinates(evt: any): EventCoordinates | null {
	if (!evt) return null;

	const touch =
		(evt.touches && evt.touches[0]) ||
		(evt.changedTouches && evt.changedTouches[0]) ||
		evt;

	if (touch && typeof touch.clientX === "number" && typeof touch.clientY === "number") {
		return { x: touch.clientX, y: touch.clientY };
	}

	return null;
}
