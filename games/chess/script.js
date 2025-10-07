// ===== script.js (REPLACE your old script.js with this) =====

// Initialize the chessboard and game logic
var board = null;
var game = new Chess();
var $status = $('#status');

// --- Configurable AI strength (you can change this) ---
var defaultAIDepth = 3; // default target depth (dynamic will adjust)

// --- PIECE-SQUARE TABLES for better evaluation (from white perspective) ---
const PST = {
  p: [
    [0,0,0,0,0,0,0,0],
    [5,5,5,-5,-5,5,5,5],
    [1,1,2,3,3,2,1,1],
    [0.5,0.5,1.5,2.5,2.5,1.5,0.5,0.5],
    [0,0,0,2,2,0,0,0],
    [0.5,-0.5,-1,0,0,-1,-0.5,0.5],
    [0.5,1,1,-2,-2,1,1,0.5],
    [0,0,0,0,0,0,0,0]
  ],
  n: [
    [-5,-4,-3,-3,-3,-3,-4,-5],
    [-4,-2,0,0,0,0,-2,-4],
    [-3,0,1.5,2,2,1.5,0,-3],
    [-3,0.5,2,2.5,2.5,2,0.5,-3],
    [-3,0,2.5,2.5,2.5,2,0,-3],
    [-3,0.5,1.5,2,2,1.5,0.5,-3],
    [-4,-2,0,0.5,0.5,0,-2,-4],
    [-5,-4,-3,-3,-3,-3,-4,-5]
  ],
  b: [
    [-2,-1,-1,-1,-1,-1,-1,-2],
    [-1,0,0,0,0,0,0,-1],
    [-1,0,0.5,1,1,0.5,0,-1],
    [-1,0.5,0.5,1,1,0.5,0.5,-1],
    [-1,0,0.5,1,1,0.5,0,-1],
    [-1,0.5,0,0,0,0,0.5,-1],
    [-1,0,0,0,0,0,0,-1],
    [-2,-1,-1,-1,-1,-1,-1,-2]
  ],
  r: [
    [0,0,0,0,0,0,0,0],
    [0.5,1,1,1,1,1,1,0.5],
    [-0.5,0,0,0,0,0,0,-0.5],
    [-0.5,0,0,0,0,0,0,-0.5],
    [-0.5,0,0,0,0,0,0,-0.5],
    [-0.5,0,0,0,0,0,0,-0.5],
    [-0.5,0,0,0,0,0,0,-0.5],
    [0,0,0,0.5,0.5,0,0,0]
  ],
  q: [
    [-2,-1,-1,-0.5,-0.5,-1,-1,-2],
    [-1,0,0,0,0,0,0,-1],
    [-1,0,0.5,0.5,0.5,0.5,0,-1],
    [-0.5,0,0.5,0.5,0.5,0.5,0,-0.5],
    [0,0,0.5,0.5,0.5,0.5,0, -0.5],
    [-1,0.5,0.5,0.5,0.5,0.5,0,-1],
    [-1,0,0.5,0,0,0,0,-1],
    [-2,-1,-1,-0.5,-0.5,-1,-1,-2]
  ],
  k: [
    [-3,-4,-4,-5,-5,-4,-4,-3],
    [-3,-4,-4,-5,-5,-4,-4,-3],
    [-3,-4,-4,-5,-5,-4,-4,-3],
    [-3,-4,-4,-5,-5,-4,-4,-3],
    [-2,-3,-3,-4,-4,-3,-3,-2],
    [-1,-2,-2,-2,-2,-2,-2,-1],
    [2,2,0,0,0,0,2,2],
    [2,3,1,0,0,1,3,2]
  ]
};

// Base material values
const MATERIAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Helper: square file/rank to PST indices (board from chess.js is 8x8 [rank 8..1])
function pstValue(piece, x, y) {
    if (!piece) return 0;
    const t = piece.type;
    const table = PST[t];
    if (!table) return 0;
    // chess.js board array: board[rankIndex][fileIndex] where rankIndex 0 = rank 8
    // We want PST indexed [row][col] with our PST as rank1..rank8? The PST above assumed rank8 at index 0.
    // board row index i corresponds to PST row i, so use x,y directly.
    let val = table[x][y] || 0;
    return piece.color === 'w' ? val : -val;
}

// --- Evaluation (material + PST + mobility) ---
function evaluateBoard(board) {
    let score = 0;
    let mobilityWhite = 0, mobilityBlack = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const p = board[i][j];
            if (!p) continue;
            const mat = MATERIAL[p.type] * (p.color === 'w' ? 1 : -1);
            score += mat;
            // PST add smaller weight (scale down)
            score += pstValue(p, i, j) * 10;
        }
    }
    // mobility: count pseudo-legal moves for each side (cheap)
    const wMoves = game.moves({ verbose: true }).filter(m => {
        // moves() returns moves for side to move; we need both sides; do a quick check by temporarily toggling
        return true;
    });
    // Simpler mobility estimate: number of moves for white minus black by temporarily switching turns
    const currentTurn = game.turn();
    // white mobility
    if (currentTurn === 'w') mobilityWhite = game.moves().length;
    else {
        // simulate flipping
        // do nothing because computing exact mobility for both is expensive; we'll skip heavy mobility to stay performant
        mobilityWhite = 0;
    }
    // Skip explicit mobility calculation to avoid slowdown; main strength is PST + material
    return score;
}

// --- Minimax with alpha-beta + move ordering (captures/promotions first) ---
function minimaxDepth(gameState, depth, alpha, beta, maximizingPlayer) {
    if (depth === 0 || gameState.game_over()) return quiescenceEvaluate(gameState);

    // Move ordering: prefer captures & promotions
    let moves = gameState.moves({ verbose: true });

    // If many moves, limit branching via heuristic ordering
    moves.sort((a, b) => {
        // capture weight: if move captures, value = captured piece value
        const aCap = a.captured ? MATERIAL[a.captured] || 0 : 0;
        const bCap = b.captured ? MATERIAL[b.captured] || 0 : 0;
        // promotions get bonus
        const aProm = a.promotion ? 200 : 0;
        const bProm = b.promotion ? 200 : 0;
        return (bCap + bProm) - (aCap + aProm);
    });

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (let mv of moves) {
            gameState.move(mv);
            let eval = minimaxDepth(gameState, depth - 1, alpha, beta, false);
            gameState.undo();
            if (eval > maxEval) maxEval = eval;
            if (eval > alpha) alpha = eval;
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let mv of moves) {
            gameState.move(mv);
            let eval = minimaxDepth(gameState, depth - 1, alpha, beta, true);
            gameState.undo();
            if (eval < minEval) minEval = eval;
            if (eval < beta) beta = eval;
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// Quiescence / leaf evaluate: quick evaluation using material + PST (avoid doing huge search here)
function quiescenceEvaluate(gs) {
    // Use board from gs
    const board = gs.board();
    let sum = 0;
    for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++) {
            const p = board[i][j];
            if (!p) continue;
            sum += (MATERIAL[p.type] * (p.color === 'w' ? 1 : -1));
            sum += pstValue(p, i, j) * 10;
        }
    return sum;
}

// Get best move by searching (returns a move object suitable for game.move())
function getBestMove(gameState, baseDepth) {
    // dynamic depth adjustment: deeper in endgame, shallower in opening if many moves
    const movesCount = gameState.moves().length;
    let depth = baseDepth;
    if (movesCount > 30) depth = Math.max(2, baseDepth - 1); // many options -> reduce
    else if (movesCount < 10) depth = baseDepth + 1; // endgame -> deeper
    // Get legal moves verbose (objects)
    const moves = gameState.moves({ verbose: true });
    let bestMove = null;
    let bestValue = -Infinity;

    // Order moves: captures/promotions first (already done in minimax)
    moves.sort((a, b) => {
        const aCap = a.captured ? MATERIAL[a.captured] || 0 : 0;
        const bCap = b.captured ? MATERIAL[b.captured] || 0 : 0;
        const aProm = a.promotion ? 200 : 0;
        const bProm = b.promotion ? 200 : 0;
        return (bCap + bProm) - (aCap + aProm);
    });

    for (let mv of moves) {
        gameState.move(mv);
        const val = minimaxDepth(gameState, depth - 1, -Infinity, Infinity, false);
        gameState.undo();
        if (val > bestValue) {
            bestValue = val;
            bestMove = mv;
        }
    }

    // If no move found (shouldn't happen), fall back to random legal move
    if (!bestMove) {
        const all = gameState.moves({ verbose: true });
        bestMove = all.length ? all[Math.floor(Math.random() * all.length)] : null;
    }
    return bestMove;
}

// Function to make the AI move (safe checks)
function makeAIMove() {
    if (game.game_over()) return;
    const bestMove = getBestMove(game, defaultAIDepth);
    if (!bestMove) return;
    game.move(bestMove);
    board.position(game.fen());
    updateStatus();
}

// --- USER MOVES (drag / drop) ---
function onDragStart(source, piece) {
    if (game.game_over()) return false;
    // only allow white to move (user)
    if (piece.startsWith('b')) return false;
}

function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    board.position(game.fen());
    updateStatus();
    // AI moves after short delay
    setTimeout(makeAIMove, 250);
}

// --- Highlighting helpers for check/mate & move targets ---
(function injectHighlightStyles() {
    if (document.getElementById('cm-check-styles')) return;
    const s = document.createElement('style');
    s.id = 'cm-check-styles';
    s.innerHTML = `
    .cm-highlight-move { background: radial-gradient(circle, rgba(34,139,34,0.45) 40%, transparent 40%) !important; }
    .cm-selected-square { box-shadow: inset 0 0 0 3px rgba(30,144,255,0.7) !important; }
    .cm-king-check { background: rgba(255,0,0,0.85) !important; }
    .cm-king-mate { background: rgba(0,0,0,1) !important; color: white !important; }
    .square-55d63 { position: relative; touch-action: manipulation; }
    .cm-king-mate .piece { filter: invert(1) hue-rotate(180deg) !important; } /* improve visibility on black */
    `;
    document.head.appendChild(s);
})();

function clearBoardHighlights() {
    document.querySelectorAll('[data-square]').forEach(el => {
        el.classList.remove('cm-highlight-move', 'cm-selected-square', 'cm-king-check', 'cm-king-mate');
        // also clear inline style fallback
        el.style.background = '';
    });
}

// find king square for given color ('w' or 'b')
function findKingSquare(color) {
    const boardArr = game.board(); // board[0] = rank 8
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const p = boardArr[i][j];
            if (p && p.type === 'k' && p.color === color) {
                // convert i,j to algebraic: file = 'a'+j, rank = 8-i
                const file = 'abcdefgh'[j];
                const rank = 8 - i;
                return file + rank;
            }
        }
    }
    return null;
}

// Show legal move highlights for a selected square (used by mobile tap code)
function highlightLegalMoves(fromSquare) {
    clearBoardHighlights();
    const moves = game.moves({ square: fromSquare, verbose: true });
    // mark selected
    const selEl = document.querySelector(`[data-square="${fromSquare}"]`);
    if (selEl) selEl.classList.add('cm-selected-square');
    moves.forEach(m => {
        const el = document.querySelector(`[data-square="${m.to}"]`);
        if (el) el.classList.add('cm-highlight-move');
    });
}

// --- STATUS + check/mate highlighting ---
function updateStatus() {
    // clear prior move highlights and king highlights (we will re-add if necessary)
    // but do not clear selection highlights triggered by tap (mobile) because we want them until next action
    // We'll clear generic king highlights first:
    document.querySelectorAll('.cm-king-check, .cm-king-mate').forEach(el => {
        el.classList.remove('cm-king-check', 'cm-king-mate');
    });

    var moveColor = game.turn() === 'b' ? 'Qaralar' : 'Ağlar';
    var status = '';
    if (game.in_checkmate()) {
        status = `Oyun bitdi! ${moveColor} şahmat ilə məğlub oldu!`;
        // the side to move is checkmated (moveColor). Highlight their king with black background
        const kingSq = findKingSquare(game.turn());
        if (kingSq) {
            const el = document.querySelector(`[data-square="${kingSq}"]`);
            if (el) el.classList.add('cm-king-mate');
        }
    } else if (game.in_draw()) {
        status = 'Game over, drawn position.';
    } else {
        status = `${moveColor} gediş edir...`;
        if (game.in_check()) {
            status += `, ${moveColor} is in check`;
            // highlight that player's king with red
            const kingSq = findKingSquare(game.turn());
            if (kingSq) {
                const el = document.querySelector(`[data-square="${kingSq}"]`);
                if (el) el.classList.add('cm-king-check');
            }
        }
    }
    $status.html(status);
}

// configure and initialize chessboard-js
var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    orientation: 'white',
    pieceTheme: '{piece}.png'
};

board = Chessboard('board', config);
updateStatus();

// --- MOBILE TAP SUPPORT & highlights (keeps existing drag-drop intact) ---
(function enableMobileTapSupport() {
    const boardContainer = document.getElementById('board');
    if (!boardContainer) return;
    let selectedSquare = null;

    boardContainer.addEventListener('pointerdown', function (e) {
        const sqEl = e.target.closest('.square-55d63');
        if (!sqEl) return;
        const sq = sqEl.getAttribute('data-square');
        if (!sq) return;

        // If currently a selectedSquare exists and tapped a highlighted target -> make move
        if (selectedSquare) {
            const legal = game.moves({ square: selectedSquare, verbose: true }).map(m => m.to);
            if (legal.includes(sq)) {
                const mv = game.move({ from: selectedSquare, to: sq, promotion: 'q' });
                if (mv) {
                    board.position(game.fen());
                    selectedSquare = null;
                    // clear only selection/highlights (preserve check/mate classes)
                    document.querySelectorAll('.cm-selected-square, .cm-highlight-move').forEach(el => el.classList.remove('cm-selected-square', 'cm-highlight-move'));
                    updateStatus();
                    setTimeout(makeAIMove, 300);
                    return;
                } else {
                    // illegal (shouldn't), snapback selection
                    selectedSquare = null;
                    document.querySelectorAll('.cm-selected-square, .cm-highlight-move').forEach(el => el.classList.remove('cm-selected-square', 'cm-highlight-move'));
                    return;
                }
            }
        }

        // If tapped same square again -> deselect
        if (selectedSquare === sq) {
            selectedSquare = null;
            document.querySelectorAll('.cm-selected-square, .cm-highlight-move').forEach(el => el.classList.remove('cm-selected-square', 'cm-highlight-move'));
            return;
        }

        // If tapped own piece (current player's color) -> show moves
        const piece = game.get(sq);
        if (piece && piece.color === game.turn()) {
            selectedSquare = sq;
            // clear previous selection highlights
            document.querySelectorAll('.cm-selected-square, .cm-highlight-move').forEach(el => el.classList.remove('cm-selected-square', 'cm-highlight-move'));
            highlightLegalMoves(sq);
        } else {
            // tapped empty or enemy piece but no selectedSquare -> do nothing (user can drag instead)
            selectedSquare = null;
            document.querySelectorAll('.cm-selected-square, .cm-highlight-move').forEach(el => el.classList.remove('cm-selected-square', 'cm-highlight-move'));
        }
    });
})();

// --- RESPONSIVE: fit board to viewport (height-aware) ---
function resizeBoardToViewport() {
    const margin = 40; // margin for top/bottom status etc
    const statusHeight = document.getElementById('status') ? document.getElementById('status').offsetHeight : 50;
    // Available height for board:
    const availH = window.innerHeight - statusHeight - margin;
    const availW = window.innerWidth - 20;
    // Choose board size as the smaller of availW and availH
    const size = Math.max(200, Math.min(availW, availH)); // keep minimum 200
    const boardEl = document.getElementById('board');
    if (boardEl) {
        boardEl.style.width = size + 'px';
        // chessboard.js needs resize() to redraw pieces
        try { board.resize(); } catch (e) { /* ignore if not available */ }
    }
}

// initial resize and on window changes
resizeBoardToViewport();
window.addEventListener('resize', function () {
    resizeBoardToViewport();
});
window.addEventListener('orientationchange', function () {
    // small delay to allow orientation to settle
    setTimeout(resizeBoardToViewport, 200);
});

// Expose some functions to console for debugging/tuning
window.__makeAIMove = makeAIMove;
window.__setAIDepth = function(d) { defaultAIDepth = Math.max(1, Math.min(6, d)); };
window.__clearHighlights = clearBoardHighlights;

// End of script.js
