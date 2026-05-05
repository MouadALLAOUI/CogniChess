# CogniChess - Clone Your Chess Identity

CogniChess is a unique chess platform where you don't just play against a bot; you train one to become you. The bot doesn't use external engines like Stockfish. Instead, it builds a living clone of your chess style, openings, and preferences.

## 🚀 Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
3.  **Build for Production**:
    ```bash
    npm run build
    ```

## 🧠 The 3-Layer Brain

The clone's decision-making process is powered by a hierarchical learning engine:

1.  **Layer 1: Opening Book**: Analyzes the first 15 moves of your games to replicate your favorite opening sequences.
2.  **Layer 2: Style Profiler**: Tracks your aggression, favorite pieces, and square control tendencies. It uses these weights to choose moves that "feel" like yours when memory isn't available.
3.  **Layer 3: Position Memory**: As you play more games (10+), the bot begins to memorize exact responses to specific board positions, ensuring perfect mimicry of your decisions.

## 📂 Project Map

-   `src/engine/`: Core chess rules, move validation, and FEN parsing (Pure JS).
-   `src/clone/`: The learning engine layers and decision logic.
-   `src/components/`: Reusable UI components (Board, Pieces, Modals, etc.).
-   `src/hooks/`: Custom hooks for game state, bot logic, and localStorage persistence.
-   `src/pages/`: Main application views (Home, Training, Challenge).
-   `src/assets/themes/`: Configuration for board and piece visual styles.

## 🎨 Adding New Themes

To add a new board theme:
1.  Create a new JS file in `src/assets/themes/boards/`.
2.  Export an object with `id`, `label`, `light`, `dark`, `border`, and `label_color`.
3.  Register it in `src/hooks/useTheme.js`.

To add a new piece theme:
1.  Create a new JS file in `src/assets/themes/pieces/`.
2.  Define `whiteFilter` and `blackFilter` using CSS filters (e.g., `sepia`, `brightness`, `drop-shadow`).
3.  Register it in `src/hooks/useTheme.js`.

## 📱 Mobile Support

The application is fully responsive. On smaller screens, the chess board scales to 100% width, and the game sidebar stacks neatly below the board for an optimal playing experience.
