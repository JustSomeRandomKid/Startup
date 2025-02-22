import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

console.log("Rendering Home component...");

export default function Home() {
  console.log("yes")
  return (
    <Box>
      <Text>App</Text>
      <Link to="/Auth">Go to Auth</Link>
      <Link to="/RoomScreen">Go to rooms</Link>
    </Box>
  );
}
