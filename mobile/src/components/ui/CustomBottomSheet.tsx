import React, { useCallback, useMemo, forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../hooks/useTheme';

export interface CustomBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: string[];
  onDismiss?: () => void;
}

export const CustomBottomSheet = forwardRef<BottomSheetModal, CustomBottomSheetProps>(
  ({ children, snapPoints = ['50%', '90%'], onDismiss }, ref) => {
    const { colors, borderRadius } = useTheme();

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        onDismiss={onDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: colors.background,
          borderRadius: borderRadius.xxxl,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.border,
          width: 40,
        }}
      >
        <BottomSheetView style={styles.contentContainer}>
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
});
