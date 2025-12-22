# Authentication with Cognito

## Overview

This document describes how to implement authentication using AWS Cognito User Pool with custom in-app UI for React Native (Expo). We use the raw Cognito Identity SDK (`amazon-cognito-identity-js`) instead of AWS Amplify for complete control and a seamless user experience without browser redirects.

## File Structure

Here's how to organize your authentication code:

```text
app/
├── services/
│   └── auth/
│       ├── signup.ts          # Sign up & verification
│       ├── signin.ts          # Sign in & MFA
│       ├── session.ts         # Session management
│       ├── storage.ts         # Secure token storage
│       └── password.ts        # Password management
├── config/
│   └── cognito.ts             # Cognito User Pool config
└── contexts/
    └── AuthContext/
        ├── context.ts         # React context
        ├── state.ts           # State interface
        ├── actions.ts         # Action functions
        └── Provider.tsx       # Context provider
```

## Authentication Setup

### Installation

```bash
npm install amazon-cognito-identity-js expo-secure-store
```

### Configure Cognito User Pool

```typescript
// config/cognito.ts
import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails,
  CognitoRefreshToken,
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID!,
  ClientId: process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID!,
};

export const userPool = new CognitoUserPool(poolData);

/**
 * Get a CognitoUser instance
 */
export function getCognitoUser(username: string): CognitoUser {
  return new CognitoUser({
    Username: username,
    Pool: userPool,
  });
}
```

## Sign Up Flow

```typescript
// services/auth/signup.ts
import { CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { userPool, getCognitoUser } from '@/config/cognito';

export interface SignUpParams {
  username: string;
  password: string;
  email: string;
  phoneNumber?: string;
}

export interface SignUpResult {
  userSub: string;
  userConfirmed: boolean;
}

/**
 * Register a new user
 */
export const signUp = (params: SignUpParams): Promise<SignUpResult> => {
  return new Promise((resolve, reject) => {
    const { username, password, email, phoneNumber } = params;

    const attributes = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: email,
      }),
    ];

    if (phoneNumber) {
      attributes.push(
        new CognitoUserAttribute({
          Name: 'phone_number',
          Value: phoneNumber,
        })
      );
    }

    userPool.signUp(
      username,
      password,
      attributes,
      null,
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        if (!result) {
          reject(new Error('Sign up failed'));
          return;
        }

        resolve({
          userSub: result.userSub,
          userConfirmed: result.userConfirmed,
        });
      }
    );
  });
};

/**
 * Confirm user registration with verification code
 */
export const confirmSignUp = (
  username: string,
  code: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCognitoUser(username);

    cognitoUser.confirmRegistration(code, true, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};

/**
 * Resend verification code
 */
export const resendConfirmationCode = (username: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCognitoUser(username);

    cognitoUser.resendConfirmationCode((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};
```

## Sign In Flow

```typescript
// services/auth/signin.ts
import { AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';
import { getCognitoUser, userPool } from '@/config/cognito';

export interface SignInResult {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export interface SignInChallenge {
  challengeName: 'SMS_MFA' | 'NEW_PASSWORD_REQUIRED';
  user: CognitoUser;
  userAttributes?: any;
  requiredAttributes?: string[];
}

/**
 * Sign in with username and password
 */
export const signIn = (
  username: string,
  password: string
): Promise<SignInResult | SignInChallenge> => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = getCognitoUser(username);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve({
          accessToken: result.getAccessToken().getJwtToken(),
          idToken: result.getIdToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        });
      },

      onFailure: (err) => {
        reject(err);
      },

      mfaRequired: () => {
        resolve({
          challengeName: 'SMS_MFA',
          user: cognitoUser,
        });
      },

      newPasswordRequired: (userAttributes, requiredAttributes) => {
        // Remove non-mutable attributes
        delete userAttributes.email_verified;
        delete userAttributes.phone_number_verified;

        resolve({
          challengeName: 'NEW_PASSWORD_REQUIRED',
          user: cognitoUser,
          userAttributes,
          requiredAttributes,
        });
      },
    });
  });
};

/**
 * Complete MFA challenge
 */
export const confirmMFA = (
  cognitoUser: CognitoUser,
  code: string
): Promise<SignInResult> => {
  return new Promise((resolve, reject) => {
    cognitoUser.sendMFACode(
      code,
      {
        onSuccess: (result) => {
          resolve({
            accessToken: result.getAccessToken().getJwtToken(),
            idToken: result.getIdToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken(),
          });
        },
        onFailure: (err) => {
          reject(err);
        },
      },
      'SMS_MFA'
    );
  });
};

/**
 * Complete new password required challenge
 */
export const completeNewPassword = (
  cognitoUser: CognitoUser,
  newPassword: string,
  userAttributes?: any
): Promise<SignInResult> => {
  return new Promise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(
      newPassword,
      userAttributes || {},
      {
        onSuccess: (result) => {
          resolve({
            accessToken: result.getAccessToken().getJwtToken(),
            idToken: result.getIdToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken(),
          });
        },
        onFailure: (err) => {
          reject(err);
        },
      }
    );
  });
};

/**
 * Sign out the current user
 */
export const signOut = (): Promise<void> => {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser) {
      cognitoUser.signOut();
    }

    resolve();
  });
};
```

## Session Management

```typescript
// services/auth/session.ts
import { CognitoRefreshToken } from 'amazon-cognito-identity-js';
import { userPool } from '@/config/cognito';

export interface UserSession {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  isValid: boolean;
}

/**
 * Get the current user session
 */
export const getCurrentSession = (): Promise<UserSession> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No user logged in'));
      return;
    }

    cognitoUser.getSession((err: any, session: any) => {
      if (err) {
        reject(err);
        return;
      }

      if (!session || !session.isValid()) {
        reject(new Error('Session is invalid'));
        return;
      }

      resolve({
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
        isValid: session.isValid(),
      });
    });
  });
};

/**
 * Refresh the user session using refresh token
 */
export const refreshSession = (refreshToken: string): Promise<UserSession> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No user logged in'));
      return;
    }

    const refreshTokenObj = new CognitoRefreshToken({
      RefreshToken: refreshToken,
    });

    cognitoUser.refreshSession(refreshTokenObj, (err, session) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
        isValid: session.isValid(),
      });
    });
  });
};

/**
 * Get user attributes
 */
export const getUserAttributes = (): Promise<Record<string, string>> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No user logged in'));
      return;
    }

    cognitoUser.getSession((err: any, session: any) => {
      if (err) {
        reject(err);
        return;
      }

      cognitoUser.getUserAttributes((err, attributes) => {
        if (err) {
          reject(err);
          return;
        }

        const attributesObj = attributes?.reduce((acc, attr) => {
          acc[attr.Name] = attr.Value;
          return acc;
        }, {} as Record<string, string>);

        resolve(attributesObj || {});
      });
    });
  });
};

/**
 * Check if a user is currently logged in
 */
export const isUserLoggedIn = (): boolean => {
  const cognitoUser = userPool.getCurrentUser();
  return cognitoUser !== null;
};
```

## Token Storage

```typescript
// services/auth/storage.ts
import * as SecureStore from 'expo-secure-store';

const TOKENS_KEY = '@auth_tokens';
const USER_INFO_KEY = '@user_info';

export interface StoredTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface StoredUserInfo {
  email: string;
  sub: string;
}

/**
 * Store authentication tokens securely
 */
export const storeTokens = async (tokens: StoredTokens): Promise<void> => {
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
};

/**
 * Get stored authentication tokens
 */
export const getStoredTokens = async (): Promise<StoredTokens | null> => {
  const tokensJson = await SecureStore.getItemAsync(TOKENS_KEY);
  
  if (!tokensJson) {
    return null;
  }

  try {
    return JSON.parse(tokensJson);
  } catch {
    return null;
  }
};

/**
 * Clear stored authentication tokens
 */
export const clearTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKENS_KEY);
  await SecureStore.deleteItemAsync(USER_INFO_KEY);
};

/**
 * Store user information
 */
export const storeUserInfo = async (userInfo: StoredUserInfo): Promise<void> => {
  await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(userInfo));
};

/**
 * Get stored user information
 */
export const getStoredUserInfo = async (): Promise<StoredUserInfo | null> => {
  const userInfoJson = await SecureStore.getItemAsync(USER_INFO_KEY);
  
  if (!userInfoJson) {
    return null;
  }

  try {
    return JSON.parse(userInfoJson);
  } catch {
    return null;
  }
};

/**
 * Check if stored tokens are expired
 */
export const areTokensExpired = async (): Promise<boolean> => {
  const tokens = await getStoredTokens();
  
  if (!tokens) {
    return true;
  }

  return Date.now() >= tokens.expiresAt;
};
```

## Password Management

```typescript
// services/auth/password.ts
import { getCognitoUser, userPool } from '@/config/cognito';

/**
 * Initiate forgot password flow
 */
export const forgotPassword = (username: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCognitoUser(username);

    cognitoUser.forgotPassword({
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};

/**
 * Confirm new password with verification code
 */
export const confirmPassword = (
  username: string,
  code: string,
  newPassword: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCognitoUser(username);

    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};

/**
 * Change password for authenticated user
 */
export const changePassword = (
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No user logged in'));
      return;
    }

    cognitoUser.getSession((err: any, session: any) => {
      if (err) {
        reject(err);
        return;
      }

      cognitoUser.changePassword(oldPassword, newPassword, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
};
```

## Authentication Context Integration

### State Definition

```typescript
// contexts/AuthContext/state.ts
import { CognitoUser } from 'amazon-cognito-identity-js';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    email: string;
    sub: string;
  } | null;
  tokens: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  } | null;
  error: string | null;
  // For MFA flow
  pendingMFA: {
    user: CognitoUser;
  } | null;
}

export const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  tokens: null,
  error: null,
  pendingMFA: null,
};
```

### Actions Definition

```typescript
// contexts/AuthContext/actions.ts
import * as authService from '@/services/auth';
import { storeTokens, clearTokens, storeUserInfo } from '@/services/auth/storage';
import { AuthState, initialAuthState } from './state';
import { SignUpParams } from '@/services/auth/signup';

export interface AuthActions {
  signUp: (params: SignUpParams) => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  confirmMFA: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  forgotPassword: (username: string) => Promise<void>;
  confirmPassword: (username: string, code: string, newPassword: string) => Promise<void>;
}

export function createAuthActions(
  state: AuthState,
  setState: (state: AuthState) => void
): AuthActions {
  return {
    signUp: async (params) => {
      setState({ ...state, isLoading: true, error: null });
      
      try {
        await authService.signUp(params);
        setState({
          ...state,
          isLoading: false,
        });
      } catch (error) {
        setState({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Sign up failed',
        });
        throw error;
      }
    },

    confirmSignUp: async (username, code) => {
      setState({ ...state, isLoading: true, error: null });
      
      try {
        await authService.confirmSignUp(username, code);
        setState({
          ...state,
          isLoading: false,
        });
      } catch (error) {
        setState({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Confirmation failed',
        });
        throw error;
      }
    },

    signIn: async (username, password) => {
      setState({ ...state, isLoading: true, error: null });
      
      try {
        const result = await authService.signIn(username, password);

        if ('challengeName' in result) {
          // Handle MFA or new password required
          if (result.challengeName === 'SMS_MFA') {
            setState({
              ...state,
              isLoading: false,
              pendingMFA: { user: result.user },
            });
          }
          return;
        }

        // Sign in successful
        const userAttributes = await authService.getUserAttributes();
        
        await storeTokens({
          accessToken: result.accessToken,
          idToken: result.idToken,
          refreshToken: result.refreshToken,
          expiresAt: Date.now() + 3600000, // 1 hour
        });

        await storeUserInfo({
          email: userAttributes.email,
          sub: userAttributes.sub,
        });

        setState({
          ...state,
          isAuthenticated: true,
          isLoading: false,
          user: {
            email: userAttributes.email,
            sub: userAttributes.sub,
          },
          tokens: result,
          error: null,
        });
      } catch (error) {
        setState({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Sign in failed',
        });
        throw error;
      }
    },

    confirmMFA: async (code) => {
      if (!state.pendingMFA) {
        throw new Error('No pending MFA challenge');
      }

      setState({ ...state, isLoading: true, error: null });
      
      try {
        const result = await authService.confirmMFA(state.pendingMFA.user, code);
        const userAttributes = await authService.getUserAttributes();

        await storeTokens({
          accessToken: result.accessToken,
          idToken: result.idToken,
          refreshToken: result.refreshToken,
          expiresAt: Date.now() + 3600000,
        });

        setState({
          ...state,
          isAuthenticated: true,
          isLoading: false,
          user: {
            email: userAttributes.email,
            sub: userAttributes.sub,
          },
          tokens: result,
          pendingMFA: null,
          error: null,
        });
      } catch (error) {
        setState({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : 'MFA verification failed',
        });
        throw error;
      }
    },

    signOut: async () => {
      setState({ ...state, isLoading: true });
      
      try {
        await authService.signOut();
        await clearTokens();
        
        setState({
          ...initialAuthState,
          isLoading: false,
        });
      } catch (error) {
        setState({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Sign out failed',
        });
      }
    },

    refreshSession: async () => {
      if (!state.tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      try {
        const result = await authService.refreshSession(state.tokens.refreshToken);
        
        await storeTokens({
          accessToken: result.accessToken,
          idToken: result.idToken,
          refreshToken: result.refreshToken,
          expiresAt: Date.now() + 3600000,
        });

        setState({
          ...state,
          tokens: result,
        });
      } catch (error) {
        // Refresh failed, sign out
        await this.signOut();
        throw error;
      }
    },

    forgotPassword: async (username) => {
      setState({ ...state, isLoading: true, error: null });
      
      try {
        await authService.forgotPassword(username);
        setState({
          ...state,
          isLoading: false,
        });
      } catch (error) {
        setState({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Forgot password failed',
        });
        throw error;
      }
    },

    confirmPassword: async (username, code, newPassword) => {
      setState({ ...state, isLoading: true, error: null });
      
      try {
        await authService.confirmPassword(username, code, newPassword);
        setState({
          ...state,
          isLoading: false,
        });
      } catch (error) {
        setState({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Password reset failed',
        });
        throw error;
      }
    },
  };
}
```

## Best Practices

### Do's

- ✅ **Store tokens securely** using `expo-secure-store`
- ✅ **Auto-refresh sessions** before they expire
- ✅ **Clear tokens on sign out** completely
- ✅ **Handle MFA flows** gracefully
- ✅ **Restore sessions** on app restart
- ✅ **Validate inputs** before sending to Cognito
- ✅ **Handle all error cases** (wrong password, user not found, etc.)

### Don'ts

- ❌ **Don't store tokens in AsyncStorage** (use SecureStore)
- ❌ **Don't hardcode credentials** or tokens
- ❌ **Don't skip token refresh** logic
- ❌ **Don't ignore session expiration**
- ❌ **Don't expose sensitive user data** in logs or errors

## Next Steps

- Read [API Client](./api-client.md) for making authenticated API calls
- Read [Integration Examples](./integration-examples.md) for complete working examples
- Read [Testing Strategy](./testing/) for testing authentication flows
