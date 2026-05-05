import React, { useMemo, lazy, Suspense } from 'react';

// Dynamic imports for SVG pieces by theme
const pieceImports = {
  wooden: {
    wP: () => import('../assets/pieces/wooden/wP.svg?react'),
    wN: () => import('../assets/pieces/wooden/wN.svg?react'),
    wB: () => import('../assets/pieces/wooden/wB.svg?react'),
    wR: () => import('../assets/pieces/wooden/wR.svg?react'),
    wQ: () => import('../assets/pieces/wooden/wQ.svg?react'),
    wK: () => import('../assets/pieces/wooden/wK.svg?react'),
    bP: () => import('../assets/pieces/wooden/bP.svg?react'),
    bN: () => import('../assets/pieces/wooden/bN.svg?react'),
    bB: () => import('../assets/pieces/wooden/bB.svg?react'),
    bR: () => import('../assets/pieces/wooden/bR.svg?react'),
    bQ: () => import('../assets/pieces/wooden/bQ.svg?react'),
    bK: () => import('../assets/pieces/wooden/bK.svg?react'),
  },
  metal: {
    wP: () => import('../assets/pieces/metal/wP.svg?react'),
    wN: () => import('../assets/pieces/metal/wN.svg?react'),
    wB: () => import('../assets/pieces/metal/wB.svg?react'),
    wR: () => import('../assets/pieces/metal/wR.svg?react'),
    wQ: () => import('../assets/pieces/metal/wQ.svg?react'),
    wK: () => import('../assets/pieces/metal/wK.svg?react'),
    bP: () => import('../assets/pieces/metal/bP.svg?react'),
    bN: () => import('../assets/pieces/metal/bN.svg?react'),
    bB: () => import('../assets/pieces/metal/bB.svg?react'),
    bR: () => import('../assets/pieces/metal/bR.svg?react'),
    bQ: () => import('../assets/pieces/metal/bQ.svg?react'),
    bK: () => import('../assets/pieces/metal/bK.svg?react'),
  },
};

// Cache for loaded components
const componentCache = new Map();

const SvgPiece = ({ type, theme = 'wooden', className = '' }) => {
  const [SvgComponent, setSvgComponent] = React.useState(null);
  const [error, setError] = React.useState(null);

  const pieceKey = `${theme}-${type}`;

  React.useEffect(() => {
    if (!type) return;

    // Check cache first
    const cached = componentCache.get(pieceKey);
    if (cached) {
      setSvgComponent(cached);
      return;
    }

    // Load the SVG component
    const themePieces = pieceImports[theme];
    const importFn = themePieces?.[type];

    if (!importFn) {
      setError(`No SVG found for ${type} in theme ${theme}`);
      return;
    }

    importFn()
      .then((module) => {
        const Component = module.default;
        componentCache.set(pieceKey, Component);
        setSvgComponent(Component);
      })
      .catch((err) => {
        console.error('Failed to load SVG piece:', err);
        setError(err.message);
      });
  }, [type, theme, pieceKey]);

  if (!type) return null;

  // Fallback to Unicode if SVG fails or is loading
  if (error || !SvgComponent) {
    const unicodeMap = {
      'wP': '♙', 'wN': '♘', 'wB': '♗', 'wR': '♖', 'wQ': '♕', 'wK': '♔',
      'bP': '♟', 'bN': '♞', 'bB': '♝', 'bR': '♜', 'bQ': '♛', 'bK': '♚'
    };
    return (
      <div className={`piece ${className} piece--loading`}>
        {unicodeMap[type] || '?'}
      </div>
    );
  }

  const color = type[0]; // 'w' or 'b'

  return (
    <div className={`piece ${className} piece--svg ${color === 'w' ? 'white' : 'black'}`}>
      <SvgComponent className="piece-svg" />
    </div>
  );
};

export default SvgPiece;
