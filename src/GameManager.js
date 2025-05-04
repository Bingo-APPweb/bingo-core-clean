import React, { useState, useEffect } from 'react';
import { Databases } from 'appwrite';

const GameManager = ({ client }) => {
  const [games, setGames] = useState([]);
  const databases = new Databases(client);
  const bingoFlashUrl = 'https://www.bingobetoverlay.fun/';

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await databases.listDocuments('bingo_db', 'games');
        setGames(response.documents);
      } catch (error) {
        console.error('Erro ao buscar jogos:', error);
      }
    };
    fetchGames();
  }, []);

  const createGame = async () => {
    try {
      const title = prompt('Digite o título do novo jogo:');
      if (title) {
        await databases.createDocument('bingo_db', 'games', 'unique()', {
          title,
          drawnNumbers: [],
          status: 'waiting',
          createdAt: new Date().toISOString(),
        });
        alert('Jogo criado com sucesso!');
        fetchGames();
      }
    } catch (error) {
      console.error('Erro ao criar jogo:', error);
    }
  };

  return (
    <div>
      <h2>Gerenciar Jogos</h2>
      <p>URL do BingoFlash: <a href={bingoFlashUrl} target="_blank">{bingoFlashUrl}</a></p>
      <button onClick={createGame}>Criar Novo Jogo</button>
      <ul>
        {games.map((game) => (
          <li key={game.$id}>{game.title} - {game.status}</li>
        ))}
      </ul>
    </div>
  );
};

export default GameManager;