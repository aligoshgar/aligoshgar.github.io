// Initialize the chessboard and game logic
var board = null;
var game = new Chess();
var $status = $('#status');
var aiDepth = 2;

// --- AI MOVE SECTION ---
function makeAIMove() {
    var bestMove = getBestMove(game, aiDepth);
    game.move(bestMove);
    board.position(game.fen());
    updateStatus();
}

function minimax(game, depth, alpha, beta, maximizingPlayer) {
    if (depth === 0 || game.game_over()) return -evaluateBoard(game.board());
    var moves = game.moves();
    if (maximizingPlayer) {
        var maxEval = -Infinity;
        for (var move of moves) {
            game.move(move);
            var eval = minimax(game, depth - 1, alpha, beta, false);
            game.undo();
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        var minEval = Infinity;
        for (var move of moves) {
            game.move(move);
            var eval = minimax(game, depth - 1, alpha, beta, true);
            game.undo();
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluateBoard(board) {
    var total = 0;
    for (var i = 0; i < 8; i++)
        for (var j = 0; j < 8; j++)
            total += getPieceValue(board[i][j]);
    return total;
}

function getPieceValue(piece) {
    if (!piece) return 0;
    var values = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
    return piece.color === 'w' ? values[piece.type] : -values[piece.type];
}

function getBestMove(game, depth) {
    var moves = game.moves();
    var best = null, bestVal = -Infinity;
    for (var move of moves) {
        game.move(move);
        var value = minimax(game, depth - 1, -Infinity, Infinity, false);
        game.undo();
        if (value > bestVal) {
            bestVal = value;
            best = move;
        }
    }
    return best;
}

// --- USER MOVES ---
function onDragStart(source, piece) {
    if (game.game_over()) return false;
    if (piece.startsWith('b')) return false;
}

function onDrop(source, target) {
    var move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    updateStatus();
    setTimeout(makeAIMove, 250);
}

function updateStatus() {
    var moveColor = game.turn() === 'b' ? 'Black' : 'White';
    var status = '';
    if (game.in_checkmate()) status = `Game over, ${moveColor} is in checkmate.`;
    else if (game.in_draw()) status = 'Game over, drawn position.';
    else {
        status = `${moveColor} to move`;
        if (game.in_check()) status += `, ${moveColor} is in check`;
    }
    $status.html(status);
}

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

// --- ✅ MOBILE TAP SUPPORT + MOVE HIGHLIGHT ---
(function enableMobileTapSupport() {
    const highlightClass = 'highlight-move';
    const targetClass = 'highlight-target';
    const selectedClass = 'selected-square';

    const style = document.createElement('style');
    style.textContent = `
        .${highlightClass} { background: radial-gradient(circle, rgba(255,215,0,0.4) 40%, transparent 40%); }
        .${selectedClass} { box-shadow: inset 0 0 0 3px rgba(30,144,255,0.7); }
        .${targetClass}::after {
            content: ''; position: absolute; width: 20px; height: 20px;
            border-radius: 50%; background: rgba(34,139,34,0.7);
            left: 50%; top: 50%; transform: translate(-50%,-50%);
        }
        .square-55d63 { position: relative; touch-action: manipulation; }
    `;
    document.head.appendChild(style);

    let selectedSquare = null;

    document.querySelector('#board').addEventListener('pointerdown', function (e) {
        const squareEl = e.target.closest('.square-55d63');
        if (!squareEl) return;
        const square = squareEl.getAttribute('data-square');
        if (!square) return;

        const piece = game.get(square);
        const allTargets = document.querySelectorAll(`.${highlightClass}, .${targetClass}, .${selectedClass}`);
        allTargets.forEach(el => el.classList.remove(highlightClass, targetClass, selectedClass));

        // if tapped on already-selected square, deselect
        if (selectedSquare === square) {
            selectedSquare = null;
            return;
        }

        // if tapping on a highlighted target -> make move
        if (selectedSquare) {
            const legal = game.moves({ square: selectedSquare, verbose: true }).map(m => m.to);
            if (legal.includes(square)) {
                game.move({ from: selectedSquare, to: square, promotion: 'q' });
                board.position(game.fen());
                selectedSquare = null;
                updateStatus();
                setTimeout(makeAIMove, 300);
                return;
            }
        }

        // if tapping a piece of current player (white)
        if (piece && piece.color === game.turn()) {
            selectedSquare = square;
            squareEl.classList.add(selectedClass);
            const moves = game.moves({ square, verbose: true });
            moves.forEach(m => {
                const targetEl = document.querySelector(`[data-square="${m.to}"]`);
                if (targetEl) targetEl.classList.add(highlightClass, targetClass);
            });
        } else {
            selectedSquare = null;
        }
    });
})();
