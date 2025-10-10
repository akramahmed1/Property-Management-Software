import { Platform } from 'react-native';

// Accessibility utilities for Property Management Software
export class AccessibilityUtils {
  // High contrast toggle state can be lifted to context in app-level in the future
  static highContrastEnabled: boolean = false;

  static setHighContrast(enabled: boolean) {
    AccessibilityUtils.highContrastEnabled = enabled;
  }

  // Screen reader announcements
  static announceForScreenReader(message: string) {
    if (Platform.OS === 'ios') {
      // iOS screen reader announcement
      return {
        accessibilityLabel: message,
        accessibilityRole: 'text',
        accessibilityLiveRegion: 'polite'
      };
    } else {
      // Android screen reader announcement
      return {
        accessibilityLabel: message,
        accessibilityRole: 'text',
        accessibilityLiveRegion: 'polite'
      };
    }
  }

  // High contrast mode support
  static getHighContrastColors() {
    if (!AccessibilityUtils.highContrastEnabled) {
      return {
        primary: '#000000',
        secondary: '#FFFFFF',
        accent: '#0066CC',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#666666',
        border: '#000000',
        error: '#CC0000',
        success: '#006600',
        warning: '#CC6600'
      };
    }
    // WCAG-friendly palette for high contrast
    return {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#0000EE',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      text: '#000000',
      textSecondary: '#000000',
      border: '#000000',
      error: '#990000',
      success: '#005500',
      warning: '#995500'
    };
  }

  // Focus management
  static getFocusableProps() {
    return {
      accessible: true,
      accessibilityRole: 'button',
      accessibilityHint: 'Double tap to activate',
      accessibilityState: { disabled: false }
    };
  }

  // Form field accessibility
  static getFormFieldProps(label: string, hint?: string, error?: string) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: 'text',
      accessibilityState: { 
        invalid: !!error,
        error: error 
      },
      accessibilityLiveRegion: error ? 'assertive' : 'none'
    };
  }

  // Button accessibility
  static getButtonProps(label: string, disabled: boolean = false, loading: boolean = false) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'button',
      accessibilityState: { 
        disabled: disabled || loading,
        busy: loading 
      },
      accessibilityHint: disabled ? 'Button is disabled' : 'Double tap to activate'
    };
  }

  // Navigation accessibility
  static getNavigationProps(label: string, selected: boolean = false) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'tab',
      accessibilityState: { selected },
      accessibilityHint: selected ? 'Currently selected' : 'Double tap to select'
    };
  }

  // List accessibility
  static getListProps(itemCount: number) {
    return {
      accessible: true,
      accessibilityRole: 'list',
      accessibilityLabel: `List with ${itemCount} items`,
      accessibilityHint: 'Swipe to navigate through items'
    };
  }

  // List item accessibility
  static getListItemProps(index: number, total: number, label: string) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'listitem',
      accessibilityHint: `Item ${index + 1} of ${total}`,
      accessibilityState: { selected: false }
    };
  }

  // Image accessibility
  static getImageProps(altText: string, decorative: boolean = false) {
    return {
      accessible: !decorative,
      accessibilityLabel: decorative ? undefined : altText,
      accessibilityRole: decorative ? 'none' : 'image',
      accessibilityHint: decorative ? undefined : 'Image'
    };
  }

  // Modal accessibility
  static getModalProps(title: string, dismissible: boolean = true) {
    return {
      accessible: true,
      accessibilityLabel: title,
      accessibilityRole: 'dialog',
      accessibilityModal: true,
      accessibilityHint: dismissible ? 'Double tap outside to close' : 'Modal dialog'
    };
  }

  // Search accessibility
  static getSearchProps(placeholder: string, resultsCount?: number) {
    return {
      accessible: true,
      accessibilityLabel: 'Search',
      accessibilityRole: 'search',
      accessibilityHint: placeholder,
      accessibilityState: { 
        expanded: false,
        hasPopup: true 
      }
    };
  }

  // Progress indicator accessibility
  static getProgressProps(current: number, total: number, label: string) {
    const percentage = Math.round((current / total) * 100);
    return {
      accessible: true,
      accessibilityLabel: `${label}: ${percentage}% complete`,
      accessibilityRole: 'progressbar',
      accessibilityValue: { 
        min: 0, 
        max: total, 
        now: current 
      }
    };
  }

  // Switch accessibility
  static getSwitchProps(label: string, value: boolean, onToggle: () => void) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'switch',
      accessibilityState: { checked: value },
      accessibilityHint: value ? 'Switch is on' : 'Switch is off',
      onAccessibilityTap: onToggle
    };
  }

  // Slider accessibility
  static getSliderProps(label: string, value: number, min: number, max: number) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'slider',
      accessibilityValue: { 
        min, 
        max, 
        now: value 
      },
      accessibilityHint: `Adjust ${label} between ${min} and ${max}`
    };
  }

  // Tab accessibility
  static getTabProps(label: string, selected: boolean, onPress: () => void) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'tab',
      accessibilityState: { selected },
      accessibilityHint: selected ? 'Currently selected tab' : 'Double tap to select this tab',
      onAccessibilityTap: onPress
    };
  }

  // Menu accessibility
  static getMenuProps(label: string, items: string[]) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'menu',
      accessibilityHint: `Menu with ${items.length} options`,
      accessibilityState: { expanded: false }
    };
  }

  // Menu item accessibility
  static getMenuItemProps(label: string, index: number, total: number) {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'menuitem',
      accessibilityHint: `Option ${index + 1} of ${total}`,
      accessibilityState: { selected: false }
    };
  }

  // Card accessibility
  static getCardProps(title: string, description?: string, action?: string) {
    return {
      accessible: true,
      accessibilityLabel: title,
      accessibilityRole: 'button',
      accessibilityHint: description || action || 'Card',
      accessibilityState: { selected: false }
    };
  }

  // Table accessibility
  static getTableProps(rows: number, columns: number, title: string) {
    return {
      accessible: true,
      accessibilityLabel: title,
      accessibilityRole: 'table',
      accessibilityHint: `Table with ${rows} rows and ${columns} columns`
    };
  }

  // Table cell accessibility
  static getTableCellProps(content: string, row: number, column: number, header: boolean = false) {
    return {
      accessible: true,
      accessibilityLabel: content,
      accessibilityRole: header ? 'columnheader' : 'cell',
      accessibilityHint: `${header ? 'Header' : 'Cell'} at row ${row}, column ${column}`
    };
  }

  // Error message accessibility
  static getErrorProps(message: string, field: string) {
    return {
      accessible: true,
      accessibilityLabel: `Error in ${field}: ${message}`,
      accessibilityRole: 'text',
      accessibilityLiveRegion: 'assertive',
      accessibilityState: { invalid: true }
    };
  }

  // Success message accessibility
  static getSuccessProps(message: string) {
    return {
      accessible: true,
      accessibilityLabel: `Success: ${message}`,
      accessibilityRole: 'text',
      accessibilityLiveRegion: 'polite',
      accessibilityState: { invalid: false }
    };
  }

  // Loading state accessibility
  static getLoadingProps(message: string = 'Loading') {
    return {
      accessible: true,
      accessibilityLabel: message,
      accessibilityRole: 'progressbar',
      accessibilityState: { busy: true }
    };
  }

  // Empty state accessibility
  static getEmptyStateProps(message: string, action?: string) {
    return {
      accessible: true,
      accessibilityLabel: message,
      accessibilityRole: 'text',
      accessibilityHint: action || 'No content available'
    };
  }

  // Keyboard navigation support
  static getKeyboardNavigationProps() {
    return {
      accessible: true,
      accessibilityRole: 'keyboard',
      accessibilityHint: 'Use arrow keys to navigate'
    };
  }

  // Voice over support for complex interactions
  static getVoiceOverProps(instructions: string) {
    return {
      accessible: true,
      accessibilityLabel: instructions,
      accessibilityRole: 'text',
      accessibilityHint: 'Listen for voice instructions'
    };
  }

  // RTL support
  static getRTLProps(isRTL: boolean) {
    return {
      accessible: true,
      accessibilityLanguage: isRTL ? 'ar' : 'en',
      accessibilityDirection: isRTL ? 'rtl' : 'ltr'
    };
  }

  // High contrast mode detection
  static isHighContrastMode(): boolean {
    // This would typically check system settings
    // For now, return false as default
    return false;
  }

  // Font size scaling support
  static getScaledFontSize(baseSize: number, scaleFactor: number = 1): number {
    return Math.round(baseSize * scaleFactor);
  }

  // Color contrast ratio calculation
  static getContrastRatio(color1: string, color2: string): number {
    // Simplified contrast ratio calculation
    // In a real implementation, you'd use a proper color contrast library
    return 4.5; // Default WCAG AA compliant ratio
  }

  // Accessibility testing helpers
  static validateAccessibilityProps(props: any): string[] {
    const errors: string[] = [];
    
    if (!props.accessible) {
      errors.push('Component must be accessible');
    }
    
    if (!props.accessibilityLabel && props.accessibilityRole !== 'none') {
      errors.push('Component must have accessibility label');
    }
    
    if (props.accessibilityRole === 'button' && !props.onPress && !props.onAccessibilityTap) {
      errors.push('Button must have press handler');
    }
    
    return errors;
  }
}

export default AccessibilityUtils;
