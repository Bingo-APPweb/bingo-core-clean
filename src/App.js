import React from 'react';
import { Client } from 'appwrite';
import CommunityManager from './components/CommunityManager';
import MissionManager from './components/MissionManager';
import GameManager from './components/GameManager';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('681d9c6b092fe2d2bc3f')
  .setKey('standard_9c19b4026e029462c99a814ebece86adbb4e2fd147027ea825da09d58a2104cf3c3b4b9f32ad4742c13a09895d72babdb323d67b59401a8a7a84481db404ded369ce95c66215923a50de610199e9135702a6680390e1d5bd626b8c65a9dcd63593243852c4d4c0b5c6f672a7ad610a01f14c8c809449bb8d855afbd4007138e7');

function App() {
  return (
    <div className="App">
      <h1>BingoCore - Painel Admin</h1>
      <CommunityManager client={client} />
      <MissionManager client={client} />
      <GameManager client={client} />
    </div>
  );
}

export default App;