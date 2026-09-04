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
}
export default function AnimationStateManager(): {
    captureAnimationState: () => void;
    addAnimationState: (state: AnimationState) => void;
    removeAnimationState: (target: HTMLElement) => void;
    animateAll: (callback?: () => void) => void;
    animate: (target: HTMLElement, currentRect: DOMRect, toRect: DOMRect, duration: number) => void;
};
export {};
