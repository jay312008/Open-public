import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title?: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class VisualErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {
    // Isolated so visualization rendering errors never crash Chat or Live Teacher
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback}>
          <Ionicons name="alert-circle-outline" size={18} color="#D97706" />
          <Text style={styles.text}>
            {this.props.title
              ? `Could not render "${this.props.title}". The written explanation above remains available.`
              : 'This visual diagram could not be rendered safely. The text explanation remains available.'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    marginTop: 8,
  },
  text: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 18,
  },
});
