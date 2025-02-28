import React, { useState, useEffect } from 'react';
import { TextInput, Button, View, Text } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { app, auth, db } from '../config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export default function AuthScreen() {
  // UseState variables for user input, authentication status, and error handling
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [nickname, setNickname] = useState('');
  const [showNicknameInput, setShowNicknameInput] = useState(false); // State to show nickname input

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setMessage(`Welcome, ${currentUser.email}`);
      } else {
        setUser(null);
        setMessage('');
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle user login
  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        setEmail('');
        setPassword('');
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  // Handle user signup
  const handleSignup = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const newUser = userCredential.user;
        setMessage(`Account created for ${newUser.email}`);
        setEmail('');
        setPassword('');
        setShowNicknameInput(true); // Show nickname input after signup
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  // Handle setting a user nickname
  const handleSetNickname = async () => {
    if (!nickname.trim()) {
      setError('Nickname cannot be empty.');
      return;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        nickname: nickname,
      });
      setShowNicknameInput(false); // Hide nickname input after saving
      setMessage('Nickname set successfully!');
      setNickname('');
    } catch (error) {
      setError('Error saving nickname: ' + error.message);
    }
  };

  // Handle user logout
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setMessage('You have been logged out.');
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* Display success or error messages */}
      {message && <Text style={{ color: 'green', marginBottom: 10 }}>{message}</Text>}
      {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

      {/* Authentication form */}
      {!user ? (
        <>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={{ width: 200, height: 40, borderWidth: 1, marginBottom: 10 }}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{ width: 200, height: 40, borderWidth: 1, marginBottom: 10 }}
          />
          <Button title="Login" onPress={handleLogin} />
          <Button title="Sign Up" onPress={handleSignup} />
        </>
      ) : (
        <>
          {/* Nickname input after signup */}
          {showNicknameInput ? (
            <>
              <TextInput
                placeholder="Enter your nickname"
                value={nickname}
                onChangeText={setNickname}
                style={{ width: 200, height: 40, borderWidth: 1, marginBottom: 10 }}
              />
              <Button title="Set Nickname" onPress={handleSetNickname} />
            </>
          ) : (
            <Button title="Logout" onPress={handleLogout} />
          )}
        </>
      )}
    </View>
  );
}
