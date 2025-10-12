import React from 'react';
import { PressableProps } from 'react-native';
/**
 * BusinessTracer — captures business journeys and steps
 */
export declare class BusinessTracer {
    private static currentJourney?;
    /**
     * Start a business journey (e.g. "UserOnboarding", "PurchaseFlow")
     */
    static start(journeyName: string, attrs?: Record<string, any>): void;
    /**
     * Record a business step within a journey (e.g. "PaymentAuthorized")
     */
    static step(stepName: string, attrs?: Record<string, any>): void;
    /**
     * Complete a business journey
     */
    static complete(attrs?: Record<string, any>): void;
}
/**
 * TrackedPressable — wraps a Pressable and records user interactions as steps
 */
export declare function TrackedPressable({ onPress, accessibilityLabel, children, ...rest }: PressableProps & {
    children?: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
