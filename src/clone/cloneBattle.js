/**
 * Clone vs Clone Battle System
 * Allows two bots to play each other to generate training data faster
 */

import { explainMove } from './moveExplanation.js';
import { styleToEmbedding } from './neuralStyleEmbedding.js';

/**
 * Configuration for clone battles
 */
const BATTLE_CONFIG = {
  maxMoves: 200,                    // Maximum moves per game
  timeControl: null,                // Optional time control {initial: 300, increment: 3}
  enableExplanations: true,         // Generate move explanations
  recordFullGame: true,             // Record complete game for learning
  minGamesForBattle: 5,             // Minimum games a bot must have before battling
};

/**
 * Run a battle between two clones
 * @param {Object} bot1 - First bot clone
 * @param {Object} bot2 - Second bot clone
 * @param {Object} options - Battle options
 * @returns {Object} - Battle results and generated data
 */
export async function runCloneBattle(bot1, bot2, options = {}) {
  const config = { ...BATTLE_CONFIG, ...options };
  
  // Validate bots are ready
  const validation = validateBotsForBattle(bot1, bot2, config);
  if (!validation.ready) {
    return {
      success: false,
      reason: validation.reason
    };
  }
  
  // Initialize game state
  const gameState = initializeBattleGame();
  const battleLog = {
    id: generateBattleId(),
    bot1: { id: bot1.id, name: bot1.name, color: 'white' },
    bot2: { id: bot2.id, name: bot2.name, color: 'black' },
    startTime: Date.now(),
    moves: [],
    explanations: [],
    endState: null
  };
  
  // Play game
  let moveCount = 0;
  while (!gameState.gameOver && moveCount < config.maxMoves) {
    const currentBot = gameState.turn === 'white' ? bot1 : bot2;
    const opponentBot = gameState.turn === 'white' ? bot2 : bot1;
    
    // Get move from current bot
    const moveResult = await getBotMove(currentBot, gameState, opponentBot);
    
    if (!moveResult.move) {
      // Bot resigned or error
      battleLog.endState = {
        result: gameState.turn === 'white' ? 'black_wins' : 'white_wins',
        reason: moveResult.reason || 'resignation'
      };
      break;
    }
    
    // Record move
    const moveRecord = {
      moveNumber: Math.floor(moveCount / 2) + 1,
      turn: gameState.turn,
      bot: currentBot.id,
      botName: currentBot.name,
      san: moveResult.move.san,
      from: moveResult.move.from,
      to: moveResult.move.to,
      piece: moveResult.move.piece,
      captured: moveResult.move.captured,
      timestamp: Date.now()
    };
    
    battleLog.moves.push(moveRecord);
    
    // Generate explanation if enabled
    if (config.enableExplanations) {
      const explanation = explainMove(
        moveResult.move,
        currentBot,
        gameState.board,
        moveResult.legalMoves
      );
      battleLog.explanations.push({
        moveNumber: moveRecord.moveNumber,
        turn: gameState.turn,
        ...explanation
      });
    }
    
    // Apply move to game state
    applyMoveToGameState(gameState, moveResult.move);
    
    moveCount++;
  }
  
  // Determine final result if not already set
  if (!battleLog.endState) {
    battleLog.endState = determineBattleResult(gameState, moveCount);
  }
  
  battleLog.endTime = Date.now();
  battleLog.duration = battleLog.endTime - battleLog.startTime;
  
  // Generate learning data from battle
  const learningData = generateLearningData(battleLog, bot1, bot2);
  
  return {
    success: true,
    battle: battleLog,
    learningData,
    summary: generateBattleSummary(battleLog)
  };
}

/**
 * Validate both bots are ready for battle
 */
function validateBotsForBattle(bot1, bot2, config) {
  if (!bot1 || !bot2) {
    return { ready: false, reason: 'Both bots must be provided' };
  }
  
  if (bot1.id === bot2.id) {
    return { ready: false, reason: 'Cannot battle the same bot' };
  }
  
  if (bot1.cloneData.gamesPlayed < config.minGamesForBattle) {
    return { 
      ready: false, 
      reason: `${bot1.name} needs at least ${config.minGamesForBattle} games before battling` 
    };
  }
  
  if (bot2.cloneData.gamesPlayed < config.minGamesForBattle) {
    return { 
      ready: false, 
      reason: `${bot2.name} needs at least ${config.minGamesForBattle} games before battling` 
    };
  }
  
  return { ready: true };
}

/**
 * Initialize game state for battle
 */
function initializeBattleGame() {
  return {
    board: getInitialBoardPosition(),
    turn: 'white',
    castling: {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true }
    },
    enPassant: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
    gameOver: false,
    winner: null
  };
}

/**
 * Get move from a bot using its decision system
 */
async function getBotMove(bot, gameState, opponentBot) {
  try {
    // Import bot decision logic
    const { makeDecision } = await import('./cloneDecision.js');
    
    const legalMoves = generateAllLegalMoves(gameState.board, gameState.turn);
    
    if (legalMoves.length === 0) {
      return { move: null, reason: 'no_legal_moves' };
    }
    
    const decision = await makeDecision(
      bot.cloneData,
      gameState.board,
      gameState.turn,
      legalMoves
    );
    
    return {
      move: decision.move,
      legalMoves,
      confidence: decision.confidence
    };
  } catch (error) {
    console.error('Error getting bot move:', error);
    return { move: null, reason: 'error' };
  }
}

/**
 * Apply move to game state
 */
function applyMoveToGameState(gameState, move) {
  // Update board
  gameState.board = executeMoveOnBoard(gameState.board, move);
  
  // Update castling rights
  updateCastlingRights(gameState, move);
  
  // Update en passant
  gameState.enPassant = getEnPassantSquare(move);
  
  // Update clocks
  if (move.captured || move.piece.toLowerCase() === 'p') {
    gameState.halfmoveClock = 0;
  } else {
    gameState.halfmoveClock++;
  }
  
  if (gameState.turn === 'black') {
    gameState.fullmoveNumber++;
  }
  
  // Switch turn
  gameState.turn = gameState.turn === 'white' ? 'black' : 'white';
  
  // Check game end conditions
  checkGameEndConditions(gameState);
}

/**
 * Generate learning data from battle
 */
function generateLearningData(battleLog, bot1, bot2) {
  const learningData = {
    gameId: battleLog.id,
    timestamp: battleLog.startTime,
    players: [
      {
        botId: bot1.id,
        color: 'white',
        result: battleLog.endState.result === 'white_wins' ? 'win' :
                battleLog.endState.result === 'black_wins' ? 'loss' : 'draw',
        moves: battleLog.moves.filter(m => m.turn === 'white').map(m => ({
          san: m.san,
          position: getPositionBeforeMove(battleLog.moves, m),
          explanation: battleLog.explanations.find(e => e.turn === 'white' && e.moveNumber === m.moveNumber)
        }))
      },
      {
        botId: bot2.id,
        color: 'black',
        result: battleLog.endState.result === 'black_wins' ? 'win' :
                battleLog.endState.result === 'white_wins' ? 'loss' : 'draw',
        moves: battleLog.moves.filter(m => m.turn === 'black').map(m => ({
          san: m.san,
          position: getPositionBeforeMove(battleLog.moves, m),
          explanation: battleLog.explanations.find(e => e.turn === 'black' && e.moveNumber === m.moveNumber)
        }))
      }
    ],
    pgn: convertToPGN(battleLog),
    metadata: {
      duration: battleLog.duration,
      totalMoves: battleLog.moves.length,
      result: battleLog.endState.result
    }
  };
  
  return learningData;
}

/**
 * Generate human-readable battle summary
 */
function generateBattleSummary(battleLog) {
  const winner = battleLog.endState.result === 'white_wins' ? battleLog.bot1.name :
                 battleLog.endState.result === 'black_wins' ? battleLog.bot2.name : null;
  
  return {
    title: `${battleLog.bot1.name} vs ${battleLog.bot2.name}`,
    result: winner ? `${winner} wins` : 'Draw',
    moves: battleLog.moves.length,
    duration: formatDuration(battleLog.duration),
    keyMoments: extractKeyMoments(battleLog)
  };
}

/**
 * Extract key moments from battle
 */
function extractKeyMoments(battleLog) {
  const moments = [];
  
  // Find captures
  const captures = battleLog.moves.filter(m => m.captured);
  if (captures.length > 0) {
    moments.push({
      type: 'first_capture',
      move: captures[0],
      description: `First capture: ${captures[0].san}`
    });
  }
  
  // Find long explanation (interesting move)
  if (battleLog.explanations.length > 0) {
    const interestingMove = battleLog.explanations.reduce((prev, curr) => 
      (curr.reasons?.length || 0) > (prev.reasons?.length || 0) ? curr : prev
    );
    if (interestingMove.reasons?.length > 1) {
      moments.push({
        type: 'interesting_move',
        move: battleLog.moves.find(m => 
          m.turn === interestingMove.turn && m.moveNumber === interestingMove.moveNumber
        ),
        explanation: interestingMove.summary
      });
    }
  }
  
  return moments;
}

/**
 * Run tournament between multiple clones
 */
export async function runCloneTournament(bots, options = {}) {
  const { rounds = 2, timeControl = null } = options;
  const standings = {};
  const games = [];
  
  // Initialize standings
  bots.forEach(bot => {
    standings[bot.id] = {
      bot,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0
    };
  });
  
  // Create pairings
  const pairings = createTournamentPairings(bots, rounds);
  
  // Play all games
  for (const pairing of pairings) {
    const result = await runCloneBattle(pairing.white, pairing.black, { timeControl });
    
    if (result.success) {
      games.push(result.battle);
      
      // Update standings
      const whiteResult = result.battle.endState.result;
      if (whiteResult === 'white_wins') {
        standings[pairing.white.id].wins++;
        standings[pairing.white.id].points += 1;
        standings[pairing.black.id].losses++;
      } else if (whiteResult === 'black_wins') {
        standings[pairing.black.id].wins++;
        standings[pairing.black.id].points += 1;
        standings[pairing.white.id].losses++;
      } else {
        standings[pairing.white.id].draws++;
        standings[pairing.white.id].points += 0.5;
        standings[pairing.black.id].draws++;
        standings[pairing.black.id].points += 0.5;
      }
    }
  }
  
  // Sort standings by points
  const sortedStandings = Object.values(standings).sort((a, b) => b.points - a.points);
  
  return {
    success: true,
    games,
    standings: sortedStandings,
    winner: sortedStandings[0]?.bot
  };
}

/**
 * Create tournament pairings (round-robin)
 */
function createTournamentPairings(bots, rounds) {
  const pairings = [];
  
  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < bots.length; i++) {
      for (let j = i + 1; j < bots.length; j++) {
        // Alternate colors
        const white = round % 2 === 0 ? bots[i] : bots[j];
        const black = round % 2 === 0 ? bots[j] : bots[i];
        
        pairings.push({ white, black, round });
      }
    }
  }
  
  return pairings;
}

// Helper functions (stubs - integrate with existing engine)
function generateBattleId() {
  return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getInitialBoardPosition() {
  return [];
}

function generateAllLegalMoves(board, turn) {
  return [];
}

function executeMoveOnBoard(board, move) {
  return board;
}

function updateCastlingRights(gameState, move) {
  // Update castling rights based on move
}

function getEnPassantSquare(move) {
  return null;
}

function checkGameEndConditions(gameState) {
  // Check for checkmate, stalemate, etc.
  gameState.gameOver = false;
}

function determineBattleResult(gameState, moveCount) {
  if (gameState.winner) {
    return { result: `${gameState.winner}_wins` };
  }
  return { result: 'draw', reason: 'max_moves_reached' };
}

function getPositionBeforeMove(moves, currentMove) {
  return {};
}

function convertToPGN(battleLog) {
  return '';
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${seconds}s`;
}

export default {
  runCloneBattle,
  runCloneTournament,
  BATTLE_CONFIG
};
