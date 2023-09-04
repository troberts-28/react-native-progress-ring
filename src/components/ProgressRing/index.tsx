import React, {
    useEffect,
    forwardRef,
    useMemo,
    useImperativeHandle,
    useCallback,
    useRef,
} from "react";
import { View } from "react-native";
import Animated, {
    Easing,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    EasingFunction,
    EasingFunctionFactory,
    withDelay,
    runOnJS,
    interpolateColor,
    cancelAnimation,
} from "react-native-reanimated";

import { generateStyles } from "./ProgressRing.styles";

export type TrackColorType = {
    value: number;
    color: string;
};

export interface ProgressRingRef {
    play: () => void;
    pause: () => void;
    reset: (options?: { startInPausedState?: boolean }) => void;
}

export interface ProgressRingProps {
    progress: number; // between zero and 100
    initialProgress?: number; // useful if using as a countdown timer
    duration?: number;
    delay?: number;
    startInPausedState?: boolean;
    onAnimationComplete?: () => void;
    easing?: EasingFunction | EasingFunctionFactory;
    clockwise?: boolean;
    rotateStartPointBy?: number;
    size?: number;
    trackWidth?: number;
    inActiveTrackWidth?: number;
    useRoundedTip?: boolean;
    theme?: "light" | "dark";
    trackColor?: string | TrackColorType[];
    inActiveTrackColor?: string;
    backgroundColor?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    containerStyle?: any;
}

// FIX STYLING FOR active track width > inactive track width
// make it possible to just have dot?

const ProgressRing = forwardRef(
    (
        {
            progress,
            initialProgress = 0,
            duration = 500,
            delay = 0,
            startInPausedState = false,
            onAnimationComplete,
            easing = Easing.linear,
            clockwise = true,
            rotateStartPointBy = 0,
            size = 300,
            trackWidth = 30,
            inActiveTrackWidth = 40,
            useRoundedTip = true,
            theme = "light",
            trackColor,
            inActiveTrackColor,
            backgroundColor,
            containerStyle,
        }: ProgressRingProps,
        ref
    ) => {
        const styles = useMemo(
            () =>
                generateStyles({
                    theme,
                    size,
                    progress,
                    trackWidth,
                    inActiveTrackWidth,
                    trackColor,
                    inActiveTrackColor,
                    backgroundColor,
                    clockwise,
                    rotateStartPointBy,
                    containerStyle,
                }),
            [
                theme,
                size,
                progress,
                trackWidth,
                inActiveTrackWidth,
                trackColor,
                inActiveTrackColor,
                backgroundColor,
                clockwise,
                rotateStartPointBy,
                containerStyle,
            ]
        );

        // avoid invalid progress inputs
        const adjustedProgress = useMemo(() => {
            return Math.min(Math.max(progress / 100, 0), 1);
        }, [progress]);
        const adjustedInitalProgress = useMemo(() => {
            return Math.min(Math.max(initialProgress / 100, 0), 1);
        }, [initialProgress]);

        const animatedProgress = useSharedValue(adjustedInitalProgress);
        const animationInProgress = useSharedValue(false);
        // store the progress we are animating from so we can adjust animation duration after pausing
        const previousProgress = useSharedValue(adjustedInitalProgress);
        const angle = useSharedValue(-Math.PI / 2);

        const animateProgress = useCallback(() => {
            if (animatedProgress.value === adjustedProgress) {
                return;
            }

            const adjustedDuration =
                adjustedProgress - previousProgress.value != 0
                    ? Math.abs(
                          (adjustedProgress - animatedProgress.value) /
                              (adjustedProgress - previousProgress.value)
                      ) * duration
                    : duration;

            animationInProgress.value = true;

            animatedProgress.value = withDelay(
                delay,
                withTiming(
                    adjustedProgress,
                    {
                        duration: adjustedDuration,
                        easing,
                    },
                    (isFinished) => {
                        if (isFinished) {
                            animationInProgress.value = false;
                            previousProgress.value = animatedProgress.value;
                            if (onAnimationComplete) {
                                runOnJS(onAnimationComplete)();
                            }
                        }
                    }
                )
            );

            // map progress [0, 1] to angle [-π/2, 3π/2]
            angle.value = withDelay(
                delay,
                withTiming(-Math.PI / 2 + 2 * Math.PI * adjustedProgress, {
                    duration: adjustedDuration,
                    easing,
                })
            );
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [
            adjustedProgress,
            animatedProgress,
            angle,
            delay,
            duration,
            easing,
            onAnimationComplete,
            previousProgress.value,
        ]);

        const play = useCallback(() => {
            // Use the stored progress to continue the animation
            animateProgress();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [animateProgress]);

        const pause = useCallback(() => {
            cancelAnimation(animatedProgress);
            cancelAnimation(angle);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        const reset = useCallback(() => {
            previousProgress.value = adjustedInitalProgress;
            animatedProgress.value = Math.min(
                Math.max(initialProgress / 100, 0),
                1
            );
            angle.value = -Math.PI / 2;
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [adjustedInitalProgress, initialProgress]);

        const initialRender = useRef(true);

        useEffect(() => {
            if (initialRender.current) {
                initialRender.current = false;
                if (startInPausedState) {
                    return;
                }
            }
            // if we are already animating progress when the progress changes
            // cancel the current animations and update previous progress based on current progress
            // so adjusted duration is correct
            if (animationInProgress.value === true) {
                pause();
                previousProgress.value = animatedProgress.value;
            }
            // animate progress value whenever it changes
            animateProgress();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [adjustedProgress]);

        useImperativeHandle(ref, () => ({
            reset: (options?: { startInPausedState?: boolean }) => {
                reset();
                if (!(options?.startInPausedState ?? startInPausedState)) {
                    animateProgress();
                }
            },
            play: () => {
                play();
            },
            pause: () => {
                pause();
            },
        }));

        const animatedTrackColors = useMemo(() => {
            if (typeof trackColor !== "string" && trackColor !== undefined) {
                const sortedTrackColors = trackColor.sort(
                    (a, b) => a.value - b.value
                );
                return {
                    values: sortedTrackColors.map((item) => item.value),
                    colors: sortedTrackColors.map((item) => item.color),
                };
            }
        }, [trackColor]);

        const trackAnimatedColorStyle = useAnimatedStyle(() => {
            if (!animatedTrackColors) {
                return {};
            }

            return {
                backgroundColor: interpolateColor(
                    animatedProgress.value * 100,
                    animatedTrackColors?.values,
                    animatedTrackColors?.colors
                ),
            };
        });

        const activeTrackRightHalfContainerAnimatedStyle = useAnimatedStyle(
            () => {
                return {
                    opacity: animatedProgress.value > 0 ? 1 : 0,
                    transform: [
                        {
                            rotate: `${
                                animatedProgress.value <= 0.5
                                    ? animatedProgress.value * 360 - 180
                                    : 0
                            }deg`,
                        },
                    ],
                };
            }
        );

        const activeTrackLeftHalfContainerAnimatedStyle = useAnimatedStyle(
            () => {
                return {
                    opacity: animatedProgress.value > 0.5 ? 1 : 0,
                    transform: [
                        {
                            rotate:
                                animatedProgress.value > 0.5
                                    ? `${
                                          (animatedProgress.value - 0.5) * 360 -
                                          180
                                      }deg`
                                    : "0deg",
                        },
                    ],
                };
            }
        );

        // used to mask the side of the active track that goes beyond 0 degrees
        // when the progress is less than 50%
        const activeTrackRightHalfMaskAnimatedStyle = useAnimatedStyle(() => {
            return {
                opacity: animatedProgress.value < 0.5 ? 1 : 0,
            };
        });

        const startTipAnimatedStyle = useAnimatedStyle(() => {
            if (!useRoundedTip) {
                return {};
            }

            return {
                opacity: animatedProgress.value > 0 ? 1 : 0,
            };
        });

        const endTipAnimatedStyle = useAnimatedStyle(() => {
            if (!useRoundedTip) {
                return {};
            }

            const radius = size / 2;
            const middleTrackRadius = radius - inActiveTrackWidth / 2;
            const x = middleTrackRadius * Math.cos(angle.value);
            const y = middleTrackRadius * Math.sin(angle.value);

            return {
                opacity: animatedProgress.value > 0 ? 1 : 0,
                top: undefined,
                left: undefined,
                transform: [
                    { translateX: x + radius - trackWidth / 2 },
                    { translateY: y + radius - trackWidth / 2 },
                ],
            };
        }, []);

        return (
            <View style={styles.container}>
                {/* InActive Track */}
                <View style={styles.inActiveTrack} />

                {/* Right half of active track */}
                <Animated.View
                    style={[
                        styles.activeTrackRightHalfContainer,
                        activeTrackRightHalfContainerAnimatedStyle,
                    ]}>
                    <Animated.View
                        style={[
                            styles.activeTrackRightHalf,
                            trackAnimatedColorStyle,
                        ]}
                    />
                </Animated.View>

                {/* Mask for right half of active track */}
                <Animated.View
                    style={[
                        styles.activeTrackMaskRightHalf,
                        activeTrackRightHalfMaskAnimatedStyle,
                    ]}
                />

                {/* Left half of active track */}
                <Animated.View
                    style={[
                        styles.activeTrackLeftHalfContainer,
                        activeTrackLeftHalfContainerAnimatedStyle,
                    ]}>
                    <Animated.View
                        style={[
                            styles.activeTrackLeftHalf,
                            trackAnimatedColorStyle,
                        ]}
                    />
                </Animated.View>

                {useRoundedTip ? (
                    <>
                        {/* Circle at the start for rounded edge */}
                        <Animated.View
                            style={[
                                styles.roundedTipStart,
                                startTipAnimatedStyle,
                                trackAnimatedColorStyle,
                            ]}
                        />
                        {/* Circle at the end for rounded edge */}
                        <Animated.View
                            style={[
                                styles.roundedTipEnd,
                                endTipAnimatedStyle,
                                trackAnimatedColorStyle,
                            ]}
                        />
                    </>
                ) : null}

                {/* Circle to show the inner inactive track */}
                <View style={styles.inActiveTrackInnerOverlay} />

                {/* Circle to hide the center of the ring */}
                <View style={styles.innerRingMask} />
            </View>
        );
    }
);

export default React.memo(ProgressRing);
