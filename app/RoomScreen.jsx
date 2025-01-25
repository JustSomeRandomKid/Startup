import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TextInput, Dimensions, PanResponder } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, addDoc, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { WebView } from 'react-native-webview';

export default function RoomsScreen() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [nickname, setNickname] = useState('Guest');
  const user = auth.currentUser;

  const screenHeight = Dimensions.get('window').height;
  const [webViewHeight, setWebViewHeight] = useState(screenHeight * 0.65);
  const minWebViewHeight = screenHeight * 0.3;
  const maxWebViewHeight = screenHeight * 0.733;

  const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const fetchRooms = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'rooms'));
      setRooms(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchMessages = async (roomId) => {
    if (!roomId) return;
    try {
      const messagesQuery = query(
        collection(db, 'rooms', roomId, 'messages'),
        orderBy('time')
      );
      const querySnapshot = await getDocs(messagesQuery);
      setMessages(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse());
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchNickname = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) setNickname(userDoc.data().nickname || 'Guest');
    } catch (error) {
      console.error('Error fetching nickname:', error);
    }
  };

  const handleAddMessage = async () => {
    if (!message.trim()) return;
    try {
      const newMessage = { text: message, time: getCurrentTime(), nickname };
      await addDoc(collection(db, 'rooms', selectedRoom.id, 'messages'), newMessage);
      setMessages([newMessage, ...messages]);
      setMessage('');
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchNickname();
  }, [user]);

  // Dragging logic for resizing
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const newHeight = webViewHeight + gestureState.dy;
      if (newHeight >= minWebViewHeight && newHeight <= maxWebViewHeight) {
        setWebViewHeight(newHeight);
      }
    },
  });

  return (
    <View style={{ flex: 1, flexDirection: 'row', padding: 20 }}>
      {selectedRoom === null ? (
        <View style={{ flex: 1, marginRight: 20 }}>
          <Text>Select a Room:</Text>
          <FlatList
            data={rooms}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={{ marginBottom: 20 }}>
                <Button
                  title={item.name}
                  onPress={() => {
                    setSelectedRoom(item);
                    fetchMessages(item.id);
                  }}
                />
              </View>
            )}
          />
        </View>
      ) : (
        <View style={{ flex: 2 }}>
          <Text>Room: {selectedRoom.name}</Text>

          {/* WebView Section */}
          {selectedRoom.name === 'Debate Room' ? (
            <View style={{ height: webViewHeight }}>
              <WebView
                source={{ uri: 'https://soundation.com/studio' }}
                style={{ width: '100%', height: '100%', backgroundColor: 'lightgray' }}
              />
            </View>
          ) : (
            <View>
              <Text>Room content (e.g., drawing, music app, etc.)</Text>
            </View>
          )}

          {/* Draggable Divider */}
          <View
            {...panResponder.panHandlers}
            style={{
              height: 15,
              backgroundColor: 'gray',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 10 }}>⬆ Drag ⬇</Text>
          </View>

          {/* Chat Section */}
          <View style={{ height: screenHeight - webViewHeight - 60, marginTop: 10 }}>
            <TextInput
              placeholder="Type a message..."
              value={message}
              onChangeText={setMessage}
              style={{
                borderWidth: 1,
                padding: 10,
                marginBottom: 10,
                width: '100%',
                height: 40,
                borderRadius: 5,
              }}
            />
            <Button title="Send Message" onPress={handleAddMessage} />

            {/* FlatList to Display Messages */}
            <FlatList
              data={messages}
              keyExtractor={(item, index) => item.id || `${item.time}-${item.nickname}-${index}`}
              renderItem={({ item }) => (
                <Text>
                  <Text style={{ fontWeight: 'bold' }}>{item.nickname} </Text>
                  <Text style={{ color: 'gray' }}>({item.time})</Text>: {item.text}
                </Text>
              )}
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      )}
    </View>
  );
}
