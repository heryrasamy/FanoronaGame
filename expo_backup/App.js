import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const ROWS = 5;
const COLS = 9;

export default function FanoronaApp() {
    const createInitialBoard = () => {
        const board = Array(ROWS).fill(null).map(() => Array(COLS).fill(" "));

        // Ligne 0 : tous pions bleus (X)
        board[0] = ["X", "X", "X", "X", "X", "X", "X", "X", "X"];

        // Ligne 1 : tous pions bleus (X)
        board[1] = ["X", "X", "X", "X", "X", "X", "X", "X", "X"];

        // Ligne 2 (centrale) : rouge-bleu-rouge-bleu-VIDE-rouge-bleu-rouge-bleu
        board[2] = ["O", "X", "O", "X", " ", "O", "X", "O", "X"];

        // Ligne 3 : tous pions rouges
        board[3] = ["O", "O", "O", "O", "O", "O", "O", "O", "O"];

        // Ligne 4 : tous pions rouges
        board[4] = ["O", "O", "O", "O", "O", "O", "O", "O", "O"];

        return board;
    };

    const [board, setBoard] = useState(createInitialBoard());
    const [selected, setSelected] = useState(null);
    const [playerTurn, setPlayerTurn] = useState(true);

    const handlePress = (i, j) => {
        if (!playerTurn) return;

        if (selected) {
            const [si, sj] = selected;
            // Permettre mouvements adjacents (horizontaux, verticaux ET diagonaux)
            const valid = (Math.abs(i - si) <= 1 && Math.abs(j - sj) <= 1) && !(i === si && j === sj) && board[i][j] === " ";
            if (valid) {
                const newBoard = board.map(row => row.slice());
                const captures = getCaptures(newBoard, [si, sj], [i, j], "X");
                newBoard[i][j] = "X";
                newBoard[si][sj] = " ";
                captures.forEach(([ci, cj]) => { newBoard[ci][cj] = " "; });
                setBoard(newBoard);
                setSelected(null);
                setPlayerTurn(false);
                return;
            } else {
                setSelected(null);
            }
        }

        if (board[i][j] === "X") setSelected([i, j]);
    };

    const getCaptures = (board, from, to, player) => {
        const opponent = player === "X" ? "O" : "X";
        const [fi, fj] = from;
        const [ti, tj] = to;
        const captures = [];

        const di = ti - fi;
        const dj = tj - fj;

        // Par approche
        let ni = ti + di, nj = tj + dj;
        while (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS && board[ni][nj] === opponent) {
            captures.push([ni, nj]);
            ni += di; nj += dj;
        }

        // Par éloignement
        ni = fi - di; nj = fj - dj;
        while (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS && board[ni][nj] === opponent) {
            captures.push([ni, nj]);
            ni -= di; nj -= dj;
        }

        return captures;
    };

    // IA basique : pion aléatoire vers case vide adjacente (avec diagonales)
    useEffect(() => {
        if (!playerTurn) {
            const moves = [];
            for (let i = 0; i < ROWS; i++) {
                for (let j = 0; j < COLS; j++) {
                    if (board[i][j] === "O") {
                        // Toutes les 8 directions (horizontales, verticales et diagonales)
                        [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([di, dj]) => {
                            const ni = i + di, nj = j + dj;
                            if (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS && board[ni][nj] === " ") {
                                moves.push([[i, j], [ni, nj]]);
                            }
                        });
                    }
                }
            }
            if (moves.length > 0) {
                const [[si, sj], [di, dj]] = moves[Math.floor(Math.random() * moves.length)];
                const newBoard = board.map(row => row.slice());
                const captures = getCaptures(newBoard, [si, sj], [di, dj], "O");
                newBoard[di][dj] = "O";
                newBoard[si][sj] = " ";
                captures.forEach(([ci, cj]) => { newBoard[ci][cj] = " "; });
                setTimeout(() => setBoard(newBoard), 300);
            }
            setTimeout(() => setPlayerTurn(true), 500);
        }
    }, [playerTurn]);

    const handleReset = () => {
        setBoard(createInitialBoard());
        setSelected(null);
        setPlayerTurn(true);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Fanorona - Vrai Plateau</Text>
            <View style={styles.board}>
                {board.map((row, r) => (
                    <View key={r} style={styles.row}>
                        {row.map((cell, c) => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.cell, selected && selected[0] === r && selected[1] === c ? styles.selected : null]}
                                onPress={() => handlePress(r, c)}
                            >
                                <Text style={[styles.text, cell === "X" ? styles.player : cell === "O" ? styles.ai : null]}>
                                    {cell}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>
            <Text style={{ marginTop: 10 }}>
                {playerTurn ? "Votre tour" : "Tour de l'IA..."}
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleReset}>
                <Text style={styles.buttonText}>Rejouer</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 50 },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
    board: { marginTop: 20 },
    row: { flexDirection: "row" },
    cell: { width: 40, height: 40, borderWidth: 1, borderColor: "#333", justifyContent: "center", alignItems: "center" },
    selected: { backgroundColor: "#ddd" },
    text: { fontSize: 20 },
    player: { color: "blue" },
    ai: { color: "red" },
    button: { marginTop: 20, padding: 10, backgroundColor: "#007AFF", borderRadius: 5 },
    buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" }
});