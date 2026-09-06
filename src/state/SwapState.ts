export class SwapState {
	private targetMoveDistance = 0;
	private lastDirection = 0;
	private pastFirstInvertThresh = false;

	public getTargetMoveDistance(): number {
		return this.targetMoveDistance;
	}

	public setTargetMoveDistance(val: number): void {
		this.targetMoveDistance = val;
	}

	public getLastDirection(): number {
		return this.lastDirection;
	}

	public setLastDirection(val: number): void {
		this.lastDirection = val;
	}

	public isPastFirstInvertThresh(): boolean {
		return this.pastFirstInvertThresh;
	}

	public setPastFirstInvertThresh(val: boolean): void {
		this.pastFirstInvertThresh = val;
	}

	public reset(): void {
		this.targetMoveDistance = 0;
		this.lastDirection = 0;
		this.pastFirstInvertThresh = false;
	}
}

export const swapState = new SwapState();
