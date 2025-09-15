import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Game, GameMoveResponse, Player } from '../../server/src/schema';

function App() {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [humanPlayer, setHumanPlayer] = useState<Player>('X');
  const [gameMessage, setGameMessage] = useState<string>('');
  const [recentGames, setRecentGames] = useState<Game[]>([]);

  // Load recent games on component mount
  const loadRecentGames = useCallback(async () => {
    try {
      const games = await trpc.getRecentGames.query();
      setRecentGames(games);
    } catch (error) {
      console.error('Failed to load recent games:', error);
    }
  }, []);

  useEffect(() => {
    loadRecentGames();
  }, [loadRecentGames]);

  const startNewGame = async () => {
    setIsLoading(true);
    setGameMessage('');
    try {
      const game = await trpc.createGame.mutate({ human_player: humanPlayer });
      setCurrentGame(game);
      setGameMessage(`New game started! You are ${humanPlayer}`);
      loadRecentGames(); // Refresh recent games
    } catch (error) {
      console.error('Failed to start new game:', error);
      setGameMessage('Failed to start new game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const makeMove = async (position: number) => {
    if (!currentGame || currentGame.status !== 'in_progress' || isLoading) {
      return;
    }

    // Check if position is already taken
    if (currentGame.board_state[position] !== null) {
      setGameMessage('That position is already taken!');
      return;
    }

    setIsLoading(true);
    setGameMessage('');

    try {
      const response: GameMoveResponse = await trpc.makeMove.mutate({
        game_id: currentGame.id,
        position: position
      });

      setCurrentGame(response.game);
      setGameMessage(response.message);
      
      if (response.game_over) {
        loadRecentGames(); // Refresh recent games when game ends
      }
    } catch (error) {
      console.error('Failed to make move:', error);
      setGameMessage('Failed to make move. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGame = async (gameId: number) => {
    setIsLoading(true);
    try {
      const game = await trpc.getGame.query({ game_id: gameId });
      setCurrentGame(game);
      setGameMessage(`Loaded game #${gameId}`);
    } catch (error) {
      console.error('Failed to load game:', error);
      setGameMessage('Failed to load game.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!currentGame) return '';
    
    if (currentGame.status === 'won') {
      if (currentGame.winner === humanPlayer) {
        return '🎉 You won! Congratulations!';
      } else {
        return '🤖 Computer won! Better luck next time!';
      }
    } else if (currentGame.status === 'draw') {
      return '🤝 It\'s a draw! Good game!';
    } else if (currentGame.current_player === humanPlayer) {
      return '🎯 Your turn!';
    } else {
      return '🤖 Computer is thinking...';
    }
  };

  const getBoardPosition = (index: number) => {
    if (!currentGame) return '';
    const value = currentGame.board_state[index];
    return value || '';
  };

  const getPositionClass = (index: number) => {
    const baseClass = "w-20 h-20 text-2xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed";
    const value = currentGame?.board_state[index];
    
    if (value === 'X') {
      return `${baseClass} text-blue-600 bg-blue-50`;
    } else if (value === 'O') {
      return `${baseClass} text-red-600 bg-red-50`;
    }
    
    return `${baseClass} hover:bg-gray-100`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎮 Tic-Tac-Toe</h1>
          <p className="text-gray-600">Play against the computer!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Controls */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚙️ Game Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Choose your symbol:</label>
                <Select value={humanPlayer} onValueChange={(value: Player) => setHumanPlayer(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="X">❌ X (goes first)</SelectItem>
                    <SelectItem value="O">⭕ O (goes second)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={startNewGame} 
                disabled={isLoading} 
                className="w-full"
                size="lg"
              >
                {isLoading ? '⏳ Starting...' : '🎯 New Game'}
              </Button>

              {currentGame && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Game #{currentGame.id}</span>
                    <Badge 
                      variant={currentGame.status === 'in_progress' ? 'default' : 'secondary'}
                    >
                      {currentGame.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-lg">
                      {getStatusMessage()}
                    </div>
                  </div>
                </div>
              )}

              {gameMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">{gameMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Board */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-center">🎲 Game Board</CardTitle>
            </CardHeader>
            <CardContent>
              {currentGame ? (
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {Array.from({ length: 9 }, (_, index) => (
                    <Button
                      key={index}
                      onClick={() => makeMove(index)}
                      disabled={
                        isLoading || 
                        currentGame.status !== 'in_progress' || 
                        currentGame.board_state[index] !== null ||
                        currentGame.current_player !== humanPlayer
                      }
                      className={getPositionClass(index)}
                      variant="outline"
                    >
                      {getBoardPosition(index)}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🎯</div>
                  <p>Start a new game to begin playing!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Games */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Recent Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentGames.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-2xl mb-2">📝</div>
                  <p className="text-sm">No games played yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentGames.map((game) => (
                    <div
                      key={game.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => loadGame(game.id)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Game #{game.id}</span>
                        <Badge 
                          variant={game.status === 'won' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {game.status === 'won' ? (
                            game.winner === 'X' ? '❌ X Won' : '⭕ O Won'
                          ) : game.status === 'draw' ? (
                            '🤝 Draw'
                          ) : (
                            '🎮 In Progress'
                          )}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {game.created_at.toLocaleDateString()} {game.created_at.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Game Instructions */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center text-gray-600">
              <h3 className="font-semibold mb-2">🎯 How to Play</h3>
              <p className="text-sm">
                Get three of your symbols in a row (horizontally, vertically, or diagonally) to win! 
                Choose your symbol (X or O) and click on empty squares to make your move. 
                The computer will automatically make its move after yours.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;