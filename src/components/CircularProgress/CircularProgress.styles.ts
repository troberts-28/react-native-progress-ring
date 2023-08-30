/* eslint-disable @typescript-eslint/no-explicit-any */
import { StyleSheet } from "react-native";

export interface CustomCircularProgressStyles {
    theme: "light" | "dark";
    radius: number;
    trackWidth: number;
    inActiveTrackWidth: number;
    trackColor?: string;
    inActiveTrackColor?: string;
    backgroundColor?: string;
    containerStyle?: any;
}

const COLORS = {
    light: {
        track: "tomato",
        inactiveTrack: "#ddd",
        background: "#ffffff",
    },
    dark: {
        track: "tomato",
        inactiveTrack: "#ddd",
        background: "#000000",
    },
};

export const generateStyles = (customStyles: CustomCircularProgressStyles) => {
    const {
        theme,
        radius,
        trackWidth,
        inActiveTrackWidth,
        trackColor,
        inActiveTrackColor,
        backgroundColor,
        containerStyle,
    } = customStyles;

    const ringPadding = (inActiveTrackWidth - trackWidth) / 2;
    const activeRingRadius = radius - ringPadding;
    const innerActiveRingRadius = radius - inActiveTrackWidth + ringPadding;

    return StyleSheet.create({
        container: {
            width: radius * 2,
            height: radius * 2,
            position: "relative",
            ...containerStyle,
        },
        inActiveTrack: {
            position: "absolute",
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            borderWidth: inActiveTrackWidth,
            borderColor: inActiveTrackColor,
            zIndex: 0,
        },
        activeTrackRightHalfContainer: {
            position: "absolute",
            top: ringPadding,
            left: ringPadding,
            width: activeRingRadius * 2,
            height: activeRingRadius * 2,
            alignItems: "flex-end",
            zIndex: 2,
        },
        activeTrackRightHalf: {
            width: activeRingRadius,
            height: activeRingRadius * 2,
            borderTopRightRadius: activeRingRadius,
            borderBottomRightRadius: activeRingRadius,
            backgroundColor: trackColor ?? COLORS[theme].track,
        },
        activeTrackMaskRightHalf: {
            position: "absolute",
            top: 0,
            left: 0,
            width: radius,
            height: radius * 2,
            borderTopLeftRadius: radius,
            borderBottomLeftRadius: radius,
            backgroundColor: inActiveTrackColor ?? COLORS[theme].inactiveTrack,
            zIndex: 2,
        },
        activeTrackLeftHalfContainer: {
            position: "absolute",
            top: ringPadding,
            left: ringPadding,
            width: activeRingRadius * 2,
            height: activeRingRadius * 2,
            zIndex: 2,
        },
        activeTrackLeftHalf: {
            width: activeRingRadius,
            height: activeRingRadius * 2,
            borderTopLeftRadius: activeRingRadius,
            borderBottomLeftRadius: activeRingRadius,
            backgroundColor: trackColor ?? COLORS[theme].track,
        },
        roundedTipStart: {
            position: "absolute",
            width: trackWidth,
            height: trackWidth,
            borderRadius: trackWidth / 2,
            top: ringPadding,
            left: radius - trackWidth / 2,
            backgroundColor: trackColor ?? COLORS[theme].track,
            zIndex: 2,
        },
        roundedTipEnd: {
            position: "absolute",
            width: trackWidth,
            height: trackWidth,
            borderRadius: trackWidth / 2,
            backgroundColor: trackColor ?? COLORS[theme].track,
            zIndex: 2,
        },
        inActiveTrackInnerOverlay: {
            position: "absolute",
            top: inActiveTrackWidth - ringPadding,
            left: inActiveTrackWidth - ringPadding,
            width: innerActiveRingRadius * 2,
            height: innerActiveRingRadius * 2,
            borderRadius: innerActiveRingRadius,
            backgroundColor: inActiveTrackColor ?? COLORS[theme].inactiveTrack,
            zIndex: 3,
        },
        innerRingMask: {
            position: "absolute",
            top: inActiveTrackWidth,
            left: inActiveTrackWidth,
            width: (radius - inActiveTrackWidth) * 2,
            height: (radius - inActiveTrackWidth) * 2,
            borderRadius: radius - inActiveTrackWidth,
            backgroundColor: backgroundColor ?? COLORS[theme].background,
            zIndex: 4,
        },
    });
};