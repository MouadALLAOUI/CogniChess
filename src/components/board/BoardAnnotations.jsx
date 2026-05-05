import React, { useState, useCallback } from 'react';
import './BoardAnnotations.scss';

const BoardAnnotations = ({ 
  boardRef, 
  isActive, 
  mode, // 'arrow', 'circle', 'eraser'
  onAnnotationsChange 
}) => {
  const [arrows, setArrows] = useState([]);
  const [circles, setCircles] = useState([]);
  const [startSquare, setStartSquare] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getSquareCoordinates = (squareId) => {
    if (!boardRef.current || !squareId) return null;
    
    const file = squareId.charCodeAt(0) - 97; // a=0, b=1, ...
    const rank = 8 - parseInt(squareId[1]); // 8=0, 7=1, ...
    
    const boardRect = boardRef.current.getBoundingClientRect();
    const squareSize = boardRect.width / 8;
    
    return {
      x: file * squareSize + squareSize / 2,
      y: rank * squareSize + squareSize / 2,
      squareSize
    };
  };

  const handleSquareClick = useCallback((squareId) => {
    if (!isActive || !mode) return;

    const coords = getSquareCoordinates(squareId);
    if (!coords) return;

    if (mode === 'arrow') {
      if (!startSquare) {
        setStartSquare(squareId);
        setIsDrawing(true);
      } else {
        if (startSquare !== squareId) {
          const startCoords = getSquareCoordinates(startSquare);
          const newArrow = {
            id: Date.now(),
            startX: startCoords.x,
            startY: startCoords.y,
            endX: coords.x,
            endY: coords.y,
            from: startSquare,
            to: squareId
          };
          setArrows(prev => [...prev, newArrow]);
          onAnnotationsChange?.({ arrows: [...arrows, newArrow], circles });
        }
        setStartSquare(null);
        setIsDrawing(false);
      }
    } else if (mode === 'circle') {
      const newCircle = {
        id: Date.now(),
        x: coords.x,
        y: coords.y,
        radius: coords.squareSize * 0.4,
        square: squareId
      };
      setCircles(prev => [...prev, newCircle]);
      onAnnotationsChange?.({ arrows, circles: [...circles, newCircle] });
    } else if (mode === 'eraser') {
      // Remove annotations near the clicked square
      const threshold = coords.squareSize * 0.5;
      
      setArrows(prev => prev.filter(arrow => {
        const distFromStart = Math.hypot(arrow.startX - coords.x, arrow.startY - coords.y);
        const distFromEnd = Math.hypot(arrow.endX - coords.x, arrow.endY - coords.y);
        return distFromStart > threshold && distFromEnd > threshold;
      }));
      
      setCircles(prev => prev.filter(circle => {
        const dist = Math.hypot(circle.x - coords.x, circle.y - coords.y);
        return dist > threshold;
      }));
    }
  }, [isActive, mode, startSquare, arrows, circles, onAnnotationsChange]);

  const clearAll = useCallback(() => {
    setArrows([]);
    setCircles([]);
    setStartSquare(null);
    setIsDrawing(false);
    onAnnotationsChange?.({ arrows: [], circles: [] });
  }, [onAnnotationsChange]);

  const cancelDrawing = useCallback(() => {
    setStartSquare(null);
    setIsDrawing(false);
  }, []);

  if (!isActive) return null;

  return (
    <>
      <svg className="board-annotations" viewBox="0 0 600 600">
        {/* Arrows */}
        {arrows.map(arrow => (
          <g key={arrow.id}>
            <line
              x1={arrow.startX}
              y1={arrow.startY}
              x2={arrow.endX}
              y2={arrow.endY}
              stroke="#2196F3"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Arrowhead */}
            <polygon
              points={`${arrow.endX},${arrow.endY} ${arrow.endX - 15},${arrow.endY - 8} ${arrow.endX - 15},${arrow.endY + 8}`}
              fill="#2196F3"
              opacity="0.8"
              transform={`rotate(${Math.atan2(arrow.endY - arrow.startY, arrow.endX - arrow.startX) * 180 / Math.PI}, ${arrow.endX}, ${arrow.endY})`}
            />
          </g>
        ))}
        
        {/* Circles */}
        {circles.map(circle => (
          <circle
            key={circle.id}
            cx={circle.x}
            cy={circle.y}
            r={circle.radius}
            fill="none"
            stroke="#4CAF50"
            strokeWidth="3"
            opacity="0.8"
          />
        ))}

        {/* Drawing preview */}
        {isDrawing && startSquare && (
          <circle
            cx={getSquareCoordinates(startSquare)?.x}
            cy={getSquareCoordinates(startSquare)?.y}
            r="8"
            fill="#2196F3"
            opacity="0.6"
          />
        )}
      </svg>

      <div className="annotation-toolbar">
        <div className="annotation-toolbar__tools">
          <button 
            className={`annotation-tool ${mode === 'arrow' ? 'annotation-tool--active' : ''}`}
            onClick={() => {}}
            title="Draw Arrow (click start, then end)"
          >
            ➔ Arrow
          </button>
          <button 
            className={`annotation-tool ${mode === 'circle' ? 'annotation-tool--active' : ''}`}
            onClick={() => {}}
            title="Draw Circle"
          >
            ○ Circle
          </button>
          <button 
            className={`annotation-tool ${mode === 'eraser' ? 'annotation-tool--active' : ''}`}
            onClick={() => {}}
            title="Erase annotations"
          >
            ⌫ Eraser
          </button>
        </div>
        <div className="annotation-toolbar__actions">
          {isDrawing && (
            <button 
              className="annotation-tool annotation-tool--cancel"
              onClick={cancelDrawing}
            >
              Cancel
            </button>
          )}
          <button 
            className="annotation-tool annotation-tool--clear"
            onClick={clearAll}
          >
            Clear All
          </button>
        </div>
      </div>
    </>
  );
};

export default BoardAnnotations;
