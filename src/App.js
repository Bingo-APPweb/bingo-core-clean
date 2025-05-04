import React from 'react';
import { Client } from 'appwrite';
import CommunityManager from './components/CommunityManager';
import MissionManager from './components/MissionManager';
import GameManager from './components/GameManager';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID)
  .setKey(process.env.REACT_APP_APPWRITE_API_KEY);

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