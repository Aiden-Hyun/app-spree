import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { AnimatedPressable } from '../src/components/AnimatedPressable';
import { AnimatedView } from '../src/components/AnimatedView';
import { router } from 'expo-router';
import { Theme } from '../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { signUp, signIn, signInWithGoogle, signInWithApple, isAppleSignInAvailable, loading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const { theme, isDark } = useTheme();
  
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  
  // Button loading animation
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScale, {
            toValue: 0.98,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(buttonScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      buttonScale.setValue(1);
    }
  }, [loading, buttonScale]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password);
        Alert.alert('Success', 'Account created! Please check your email to verify.');
      } else {
        await signIn(email, password);
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setAppleLoading(true);
      await signInWithApple();
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setAppleLoading(false);
    }
  };

  const heroGradient = isDark 
    ? [theme.colors.gray[100], theme.colors.background] as [string, string]
    : [theme.colors.primaryLight, theme.colors.background] as [string, string];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={heroGradient}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <AnimatedView delay={0} duration={600}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="leaf" size={40} color={theme.colors.primary} />
              </View>
            </View>
          </AnimatedView>
          
          <AnimatedView delay={100} duration={600}>
        <Text style={styles.title}>CalmNest</Text>
          </AnimatedView>
          
          <AnimatedView delay={200} duration={600}>
        <Text style={styles.subtitle}>Find your inner peace</Text>
          </AnimatedView>
        </LinearGradient>
        
        {/* Form Section */}
        <View style={styles.formContainer}>
          <AnimatedView delay={300} duration={500}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isSignUp 
                  ? 'Start your mindfulness journey today' 
                  : 'Continue your mindfulness journey'}
              </Text>
      </View>
          </AnimatedView>
          
          <AnimatedView delay={400} duration={500}>
            <View style={[
              styles.inputContainer,
              emailFocused && styles.inputContainerFocused
            ]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={emailFocused ? theme.colors.primary : theme.colors.textMuted} 
                style={styles.inputIcon}
              />
        <TextInput
          style={styles.input}
          placeholder="Email"
                placeholderTextColor={theme.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </AnimatedView>
          
          <AnimatedView delay={500} duration={500}>
            <View style={[
              styles.inputContainer,
              passwordFocused && styles.inputContainerFocused
            ]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={passwordFocused ? theme.colors.primary : theme.colors.textMuted} 
                style={styles.inputIcon}
              />
        <TextInput
          style={styles.input}
          placeholder="Password"
                placeholderTextColor={theme.colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
        />
            </View>
          </AnimatedView>
        
          <AnimatedView delay={600} duration={500}>
            <AnimatedPressable
          onPress={handleAuth}
          disabled={loading}
              style={styles.authButton}
            >
              <Animated.View style={[
                styles.authButtonInner,
                { transform: [{ scale: buttonScale }] }
              ]}>
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
          <Text style={styles.authButtonText}>
                      {isSignUp ? 'Create Account' : 'Sign In'}
          </Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </Animated.View>
            </AnimatedPressable>
          </AnimatedView>
        
          <AnimatedView delay={700} duration={500}>
            <AnimatedPressable
              onPress={() => setIsSignUp(!isSignUp)}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
                {isSignUp 
                  ? 'Already have an account? ' 
                  : "Don't have an account? "}
                <Text style={styles.switchTextHighlight}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
          </Text>
            </AnimatedPressable>
          </AnimatedView>

          {/* Divider */}
          <AnimatedView delay={800} duration={500}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
          </AnimatedView>

          {/* Google Sign In Button */}
          <AnimatedView delay={900} duration={500}>
            <AnimatedPressable
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              style={styles.googleButton}
            >
              <View style={styles.googleButtonInner}>
                {googleLoading ? (
                  <ActivityIndicator color={theme.colors.text} size="small" />
                ) : (
                  <>
                    <View style={styles.googleIconContainer}>
                      <Text style={styles.googleIcon}>G</Text>
                    </View>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </View>
            </AnimatedPressable>
          </AnimatedView>

          {/* Apple Sign In Button - iOS only */}
          {isAppleSignInAvailable && (
            <AnimatedView delay={1000} duration={500}>
              <AnimatedPressable
                onPress={handleAppleSignIn}
                disabled={appleLoading}
                style={styles.appleButton}
              >
                <View style={styles.appleButtonInner}>
                  {appleLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="logo-apple" size={20} color="#fff" />
                      <Text style={styles.appleButtonText}>Continue with Apple</Text>
                    </>
                  )}
                </View>
              </AnimatedPressable>
            </AnimatedView>
          )}
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
  container: {
    flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
  },
    hero: {
      paddingTop: 80,
      paddingBottom: 60,
      alignItems: 'center',
    },
    logoContainer: {
      marginBottom: theme.spacing.lg,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surface,
    alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.md,
  },
  title: {
      fontFamily: theme.fonts.display.bold,
      fontSize: 36,
      color: theme.colors.text,
      letterSpacing: -0.5,
      marginBottom: theme.spacing.xs,
  },
  subtitle: {
      fontFamily: theme.fonts.body.italic,
    fontSize: 16,
      color: theme.colors.textLight,
  },
    formContainer: {
    flex: 1,
      padding: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
    },
    formHeader: {
      marginBottom: theme.spacing.xl,
    },
    formTitle: {
      fontFamily: theme.fonts.display.semiBold,
      fontSize: 24,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    formSubtitle: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 15,
      color: theme.colors.textLight,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 2,
      borderColor: 'transparent',
      ...theme.shadows.sm,
    },
    inputContainerFocused: {
      borderColor: theme.colors.primary,
      backgroundColor: isDark ? theme.colors.gray[100] : theme.colors.surfaceElevated,
    },
    inputIcon: {
      marginRight: theme.spacing.sm,
  },
  input: {
      flex: 1,
      fontFamily: theme.fonts.ui.regular,
    fontSize: 16,
      color: theme.colors.text,
      paddingVertical: theme.spacing.md,
  },
  authButton: {
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    authButtonInner: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
      flexDirection: 'row',
    alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      ...theme.shadows.md,
  },
  authButtonText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
    color: 'white',
  },
  switchButton: {
    alignItems: 'center',
      paddingVertical: theme.spacing.md,
  },
  switchText: {
      fontFamily: theme.fonts.ui.regular,
    fontSize: 14,
      color: theme.colors.textLight,
    },
    switchTextHighlight: {
      fontFamily: theme.fonts.ui.semiBold,
      color: theme.colors.primary,
  },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      fontFamily: theme.fonts.ui.regular,
      fontSize: 14,
      color: theme.colors.textMuted,
      paddingHorizontal: theme.spacing.md,
    },
    googleButton: {
      marginBottom: theme.spacing.lg,
    },
    googleButtonInner: {
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    googleIconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    googleIcon: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: '#4285F4',
    },
    googleButtonText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: theme.colors.text,
    },
    appleButton: {
      marginBottom: theme.spacing.lg,
    },
    appleButtonInner: {
      backgroundColor: '#000',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    appleButtonText: {
      fontFamily: theme.fonts.ui.semiBold,
      fontSize: 16,
      color: '#fff',
    },
});
