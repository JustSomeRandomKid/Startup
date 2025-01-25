import React, { useState, useEffect } from 'react';
import { TextInput, Button, View, Text, FlatList } from 'react-native';
import { collection, addDoc, getDocs, query, orderBy, getDoc, doc }  from 'firebase/firestore'; // Import getDoc and doc
import { db, auth } from '../firebaseConfig'; // Import the Firebase instances
import { getAuth } from 'firebase/auth';
import { Link } from 'expo-router';

export default function Home() {
  return(
    <View style={{ flex: 1, padding: 20 }}>
      <Text>App</Text>

      <Link href='/Auth'>Go to Auth</Link>
      <Link href='/RoomScreen'>Go to rooms</Link>
    </View>
  );
}
