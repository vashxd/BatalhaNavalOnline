class BattleshipGame {
    constructor() {
        this.currentPlayer = 1;
        this.gamePhase = 'placement'; // placement, battle, ended
        this.selectedShipSize = 5;
        this.shipDirection = 'horizontal'; // horizontal, vertical
        this.boards = {
            1: this.createEmptyBoard(),
            2: this.createEmptyBoard()
        };
        this.ships = {
            1: { 5: 1, 4: 1, 3: 2, 2: 3, 1: 4 },
            2: { 5: 1, 4: 1, 3: 2, 2: 3, 1: 4 }
        };
        this.placedShips = {
            1: [],
            2: []
        };
        this.gameLog = [];
        
        this.initializeGame();
    }

    createEmptyBoard() {
        return Array(10).fill(null).map(() => Array(10).fill(0));
    }

    initializeGame() {
        this.createBoards();
        this.setupEventListeners();
        this.updateUI();
    }

    createBoards() {
        const player1Board = document.getElementById('player1-board');
        const player2Board = document.getElementById('player2-board');
        
        player1Board.innerHTML = '';
        player2Board.innerHTML = '';
        
        for (let i = 0; i < 100; i++) {
            const row = Math.floor(i / 10);
            const col = i % 10;
            
            const cell1 = document.createElement('div');
            cell1.className = 'cell';
            cell1.dataset.player = '1';
            cell1.dataset.row = row;
            cell1.dataset.col = col;
            player1Board.appendChild(cell1);
            
            const cell2 = document.createElement('div');
            cell2.className = 'cell';
            cell2.dataset.player = '2';
            cell2.dataset.row = row;
            cell2.dataset.col = col;
            player2Board.appendChild(cell2);
        }
    }

    setupEventListeners() {
        // Ship selection
        document.querySelectorAll('.ship-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.ship-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedShipSize = parseInt(e.target.dataset.size);
            });
        });

        // Rotate button
        document.getElementById('rotate-btn').addEventListener('click', () => {
            this.shipDirection = this.shipDirection === 'horizontal' ? 'vertical' : 'horizontal';
        });

        // Finish placement
        document.getElementById('finish-placement').addEventListener('click', () => {
            this.finishPlacement();
        });        // New game
        document.getElementById('new-game').addEventListener('click', () => {
            this.newGame();
        });

        // Board clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                this.handleCellClick(e.target);
            }
        });

        // Board hover for ship placement preview
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('cell') && this.gamePhase === 'placement') {
                this.showShipPreview(e.target);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('cell') && this.gamePhase === 'placement') {
                this.clearShipPreview();
            }
        });
    }

    handleCellClick(cell) {
        const player = parseInt(cell.dataset.player);
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (this.gamePhase === 'placement') {
            if (player === this.currentPlayer) {
                this.placeShip(row, col);
            }
        } else if (this.gamePhase === 'battle') {
            const targetPlayer = this.currentPlayer === 1 ? 2 : 1;
            if (player === targetPlayer) {
                this.makeAttack(row, col, targetPlayer);
            }
        }
    }

    placeShip(row, col) {
        if (this.canPlaceShip(row, col, this.selectedShipSize, this.shipDirection, this.currentPlayer)) {
            const shipCells = this.getShipCells(row, col, this.selectedShipSize, this.shipDirection);
            
            // Place ship on board
            shipCells.forEach(([r, c]) => {
                this.boards[this.currentPlayer][r][c] = this.selectedShipSize;
            });

            this.placedShips[this.currentPlayer].push({
                size: this.selectedShipSize,
                cells: shipCells,
                hits: 0
            });

            // Update ship count
            this.ships[this.currentPlayer][this.selectedShipSize]--;

            this.updateUI();
            this.checkPlacementComplete();
        }
    }

    canPlaceShip(row, col, size, direction, player) {
        const shipCells = this.getShipCells(row, col, size, direction);
        
        // Check if ship fits on board
        if (shipCells.some(([r, c]) => r < 0 || r >= 10 || c < 0 || c >= 10)) {
            return false;
        }

        // Check if cells are empty and not adjacent to other ships
        for (let [r, c] of shipCells) {
            if (this.boards[player][r][c] !== 0) {
                return false;
            }
            
            // Check adjacent cells
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) {
                        if (this.boards[player][nr][nc] !== 0 && !shipCells.some(([sr, sc]) => sr === nr && sc === nc)) {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }

    getShipCells(row, col, size, direction) {
        const cells = [];
        for (let i = 0; i < size; i++) {
            if (direction === 'horizontal') {
                cells.push([row, col + i]);
            } else {
                cells.push([row + i, col]);
            }
        }
        return cells;
    }

    showShipPreview(cell) {
        this.clearShipPreview();
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const player = parseInt(cell.dataset.player);
        
        if (player !== this.currentPlayer || this.ships[this.currentPlayer][this.selectedShipSize] === 0) {
            return;
        }

        const shipCells = this.getShipCells(row, col, this.selectedShipSize, this.shipDirection);
        const canPlace = this.canPlaceShip(row, col, this.selectedShipSize, this.shipDirection, this.currentPlayer);
        
        shipCells.forEach(([r, c]) => {
            if (r >= 0 && r < 10 && c >= 0 && c < 10) {
                const cellElement = document.querySelector(`[data-player="${player}"][data-row="${r}"][data-col="${c}"]`);
                if (cellElement) {
                    cellElement.classList.add(canPlace ? 'preview' : 'invalid-preview');
                }
            }
        });
    }

    clearShipPreview() {
        document.querySelectorAll('.preview, .invalid-preview').forEach(cell => {
            cell.classList.remove('preview', 'invalid-preview');
        });
    }

    checkPlacementComplete() {
        const hasShipsLeft = Object.values(this.ships[this.currentPlayer]).some(count => count > 0);
        
        if (!hasShipsLeft) {
            document.getElementById('finish-placement').disabled = false;
        }

        // Update ship buttons
        document.querySelectorAll('.ship-btn').forEach(btn => {
            const size = parseInt(btn.dataset.size);
            btn.disabled = this.ships[this.currentPlayer][size] === 0;
            if (btn.disabled && btn.classList.contains('active')) {
                // Find next available ship
                const availableShip = document.querySelector('.ship-btn:not([disabled])');
                if (availableShip) {
                    document.querySelectorAll('.ship-btn').forEach(b => b.classList.remove('active'));
                    availableShip.classList.add('active');
                    this.selectedShipSize = parseInt(availableShip.dataset.size);
                }
            }
        });
    }    finishPlacement() {
        if (this.currentPlayer === 1) {
            // Show transition message for player 2
            this.showPlayerTransition(2);
            this.currentPlayer = 2;
            this.ships[2] = { 5: 1, 4: 1, 3: 2, 2: 3, 1: 4 };
            document.getElementById('finish-placement').disabled = true;
            document.querySelectorAll('.ship-btn').forEach(btn => btn.disabled = false);
            this.selectedShipSize = 5;
            document.querySelectorAll('.ship-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.ship-btn[data-size="5"]').classList.add('active');
            this.updateUI();
        } else {
            this.startBattle();
        }
    }    startBattle() {
        this.gamePhase = 'battle';
        this.currentPlayer = 1;
        document.getElementById('ship-selector').style.display = 'none';
        
        // Show battle start transition
        this.showBattleTransition();
        
        this.updateUI();
        this.addToLog('Batalha iniciada! Jogador 1 começa.');
    }makeAttack(row, col, targetPlayer) {
        if (this.boards[targetPlayer][row][col] === -1 || this.boards[targetPlayer][row][col] === -2) {
            return; // Already attacked
        }

        const isHit = this.boards[targetPlayer][row][col] > 0;
        let attackResult = '';
        
        if (isHit) {
            const shipSize = this.boards[targetPlayer][row][col];
            this.boards[targetPlayer][row][col] = -2; // Hit
            
            // Find the ship and update hits
            const ship = this.placedShips[targetPlayer].find(s => 
                s.cells.some(([r, c]) => r === row && c === col)
            );
            
            if (ship) {
                ship.hits++;
                
                if (ship.hits === ship.size) {
                    // Ship is sunk
                    ship.cells.forEach(([r, c]) => {
                        this.boards[targetPlayer][r][c] = -3; // Sunk
                    });
                    attackResult = `afundou um navio`;
                    this.addToLog(`Jogador ${this.currentPlayer} afundou um navio do Jogador ${targetPlayer}!`);
                } else {
                    attackResult = `acertou um navio`;
                    this.addToLog(`Jogador ${this.currentPlayer} acertou um navio do Jogador ${targetPlayer}!`);
                }
            }
            
            // Check win condition
            if (this.checkWin(targetPlayer)) {
                this.updateUI();
                this.endGame();
                return;
            }
        } else {
            this.boards[targetPlayer][row][col] = -1; // Miss
            attackResult = `errou o tiro`;
            this.addToLog(`Jogador ${this.currentPlayer} errou o tiro.`);
            
            // Switch player only on miss
            const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.currentPlayer = nextPlayer;
            
            // Show battle transition for next player
            this.showBattlePlayerTransition(nextPlayer, attackResult);
        }

        this.updateUI();
        
        // If hit, player continues, but still show transition to maintain privacy
        if (isHit) {
            this.showBattlePlayerTransition(this.currentPlayer, attackResult, true);
        }
    }

    checkWin(targetPlayer) {
        return this.placedShips[targetPlayer].every(ship => ship.hits === ship.size);
    }    endGame() {
        this.gamePhase = 'ended';
        const winner = this.currentPlayer;
        this.addToLog(`🎉 Jogador ${winner} venceu a batalha!`);
        
        // Show winner announcement
        const announcement = document.createElement('div');
        announcement.className = 'winner-announcement';
        announcement.innerHTML = `
            <h2>🎉 Jogador ${winner} Venceu! 🎉</h2>
            <button onclick="this.parentElement.remove(); game.newGame();">Jogar Novamente</button>
        `;
        document.body.appendChild(announcement);
    }

    newGame() {
        this.currentPlayer = 1;
        this.gamePhase = 'placement';
        this.selectedShipSize = 5;
        this.shipDirection = 'horizontal';
        this.boards = {
            1: this.createEmptyBoard(),
            2: this.createEmptyBoard()
        };
        this.ships = {
            1: { 5: 1, 4: 1, 3: 2, 2: 3, 1: 4 },
            2: { 5: 1, 4: 1, 3: 2, 2: 3, 1: 4 }
        };
        this.placedShips = {
            1: [],
            2: []
        };
        this.gameLog = [];
          document.getElementById('ship-selector').style.display = 'block';
        document.getElementById('finish-placement').disabled = true;
        document.querySelectorAll('.ship-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('active');
        });
        document.querySelector('.ship-btn[data-size="5"]').classList.add('active');
        
        document.querySelectorAll('.winner-announcement').forEach(el => el.remove());
        
        this.createBoards();
        this.updateUI();
    }

    updateUI() {
        // Update current player text
        if (this.gamePhase === 'placement') {
            document.getElementById('current-player-text').textContent = `Jogador ${this.currentPlayer} - Posicione seus navios`;
            document.getElementById('game-phase').textContent = 'Fase: Posicionando navios';
        } else if (this.gamePhase === 'battle') {
            document.getElementById('current-player-text').textContent = `Vez do Jogador ${this.currentPlayer}`;
            document.getElementById('game-phase').textContent = 'Fase: Batalha';
        }

        // Update boards
        this.updateBoard(1);
        this.updateBoard(2);

        // Update ship status
        this.updateShipStatus();

        // Update game log
        this.updateGameLog();
    }    updateBoard(player) {
        const board = document.getElementById(`player${player}-board`);
        const cells = board.querySelectorAll('.cell');
        
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 10);
            const col = index % 10;
            const cellValue = this.boards[player][row][col];
            
            cell.className = 'cell';
            
            if (this.gamePhase === 'placement') {
                // During placement, only show current player's ships
                if (player === this.currentPlayer && cellValue > 0) {
                    cell.classList.add('ship');
                } else if (cellValue === -1) {
                    cell.classList.add('miss');
                } else if (cellValue === -2) {
                    cell.classList.add('hit');
                } else if (cellValue === -3) {
                    cell.classList.add('sunk');
                }
            } else if (this.gamePhase === 'battle') {
                if (player === this.currentPlayer || this.gamePhase === 'ended') {
                    // Show own ships during battle, or all ships when game ended
                    if (cellValue > 0) {
                        cell.classList.add('ship');
                    }
                }
                // Always show hits, misses, and sunk ships for both players
                if (cellValue === -1) {
                    cell.classList.add('miss');
                } else if (cellValue === -2) {
                    cell.classList.add('hit');
                } else if (cellValue === -3) {
                    cell.classList.add('sunk');
                }
            } else if (this.gamePhase === 'ended') {
                // Show everything when game is ended
                if (cellValue > 0) {
                    cell.classList.add('ship');
                } else if (cellValue === -1) {
                    cell.classList.add('miss');
                } else if (cellValue === -2) {
                    cell.classList.add('hit');
                } else if (cellValue === -3) {
                    cell.classList.add('sunk');
                }
            }
        });
    }

    updateShipStatus() {
        const player1Ships = document.getElementById('player1-ships');
        const player2Ships = document.getElementById('player2-ships');
        
        player1Ships.innerHTML = '<h4>Navios restantes:</h4>' + this.getShipStatusHTML(1);
        player2Ships.innerHTML = '<h4>Navios restantes:</h4>' + this.getShipStatusHTML(2);
    }

    getShipStatusHTML(player) {
        const ships = this.ships[player];
        let html = '';
        
        Object.entries(ships).forEach(([size, count]) => {
            const shipName = this.getShipName(parseInt(size));
            html += `<div>${shipName}: ${count}</div>`;
        });
        
        return html;
    }

    getShipName(size) {
        const names = {
            5: 'Porta-aviões',
            4: 'Encouraçado',
            3: 'Cruzador',
            2: 'Destroyer',
            1: 'Submarino'
        };
        return names[size];
    }    addToLog(message) {
        this.gameLog.push(message);
        this.updateGameLog();
    }    showPlayerTransition(nextPlayer) {
        // Create transition overlay
        const overlay = document.createElement('div');
        overlay.className = 'player-transition';
        overlay.innerHTML = `
            <div class="transition-content">
                <h2>🔄 Troca de Jogador</h2>
                <p>Agora é a vez do <strong>Jogador ${nextPlayer}</strong> posicionar seus navios</p>
                <p class="instruction">Clique para continuar</p>
            </div>
        `;
        
        overlay.addEventListener('click', () => {
            overlay.remove();
        });
        
        document.body.appendChild(overlay);
    }    showBattleTransition() {
        // Create battle start overlay
        const overlay = document.createElement('div');
        overlay.className = 'player-transition';
        overlay.innerHTML = `
            <div class="transition-content">
                <h2>⚔️ Batalha Iniciada!</h2>
                <p>Todos os navios foram posicionados</p>
                <p><strong>Jogador 1</strong> começa atacando</p>
                <p class="instruction">Clique para iniciar a batalha</p>
            </div>
        `;
        
        overlay.addEventListener('click', () => {
            overlay.remove();
        });
        
        document.body.appendChild(overlay);
    }

    showBattlePlayerTransition(player, attackResult, samePlayer = false) {
        // Create battle transition overlay
        const overlay = document.createElement('div');
        overlay.className = 'player-transition';
        
        let message = '';
        let instruction = '';
        
        if (samePlayer) {
            // Player hit and continues playing
            message = `<h2>🎯 Acertou!</h2>
                      <p><strong>Jogador ${player}</strong> ${attackResult}</p>
                      <p>Continue jogando!</p>`;
            instruction = 'Clique para continuar sua vez';
        } else {
            // Player missed, next player's turn
            message = `<h2>🔄 Troca de Jogador</h2>
                      <p>Jogada anterior: ${attackResult}</p>
                      <p>Agora é a vez do <strong>Jogador ${player}</strong></p>`;
            instruction = 'Clique para continuar';
        }
        
        overlay.innerHTML = `
            <div class="transition-content">
                ${message}
                <p class="instruction">${instruction}</p>
            </div>
        `;
        
        overlay.addEventListener('click', () => {
            overlay.remove();
        });
        
        document.body.appendChild(overlay);
    }

    updateGameLog() {
        const logElement = document.getElementById('game-log');
        logElement.innerHTML = '<h3>Log do Jogo:</h3>';
        
        this.gameLog.slice(-5).forEach(entry => {
            const div = document.createElement('div');
            div.className = 'log-entry';
            div.textContent = entry;
            logElement.appendChild(div);
        });
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new BattleshipGame();
});
