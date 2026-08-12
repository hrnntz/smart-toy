/**
 * CustomBottomSheet component — HeroUI Native v1
 *
 * Wraps @gorhom/bottom-sheet with theme-aware styling using heroui-native's
 * useThemeColor hook. Replaces the old useTheme hook entirely.
 */
import React, { useCallback, forwardRef } from 'react';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useThemeColor } from 'heroui-native';

export interface CustomBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: string[];
  onDismiss?: () => void;
}

export const CustomBottomSheet = forwardRef<BottomSheetModal, CustomBottomSheetProps>(
  ({ children, snapPoints = ['50%', '90%'], onDismiss }, ref) => {
    const [background, separator] = useThemeColor(['overlay', 'separator']);

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
          backgroundColor: background,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
        }}
        handleIndicatorStyle={{
          backgroundColor: separator,
          width: 40,
        }}
      >
        <BottomSheetView className="flex-1 px-6 pt-2 pb-6">
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

export default CustomBottomSheet;
