import React, { useMemo } from 'react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const StyleDNA = ({ styleProfile, gamesPlayed }) => {
  const metrics = useMemo(() => {
    if (!styleProfile) {
      return {
        labels: ['Aggression', 'Center Control', 'Knight Pref', 'Castling', 'Exchange'],
        datasets: [{
          label: 'Style DNA',
          data: [0, 0, 0, 0, 0],
          backgroundColor: 'rgba(33, 150, 243, 0.2)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(33, 150, 243, 1)',
        }]
      };
    }

    // Extract and normalize metrics from styleProfile
    const aggressionScore = Math.min(100, Math.max(0, (styleProfile.aggressionScore || 50)));
    const centerControlScore = Math.min(100, Math.max(0, (styleProfile.centerControlScore || 50)));
    
    // Knight preference: higher count of knight moves vs bishop moves
    const knightMoves = styleProfile.piecePreferences?.N || 0;
    const bishopMoves = styleProfile.piecePreferences?.B || 0;
    const totalMinorPieces = knightMoves + bishopMoves || 1;
    const knightPrefScore = (knightMoves / totalMinorPieces) * 100;

    // Castling tendency: kingside vs queenside
    const kingsideCastles = styleProfile.castlingHistory?.kingside || 0;
    const queensideCastles = styleProfile.castlingHistory?.queenside || 0;
    const totalCastles = kingsideCastles + queensideCastles || 1;
    const castlingScore = (kingsideCastles / totalCastles) * 100;

    // Exchange willingness: captures made vs pieces lost
    const exchanges = styleProfile.exchangeCount || 0;
    const exchangeScore = Math.min(100, exchanges * 10);

    return {
      labels: ['Aggression', 'Center Control', 'Knight Pref', 'Castling (K-side)', 'Exchange Willingness'],
      datasets: [{
        label: 'Clone Style',
        data: [
          aggressionScore,
          centerControlScore,
          knightPrefScore,
          castlingScore,
          exchangeScore
        ],
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        borderColor: 'rgba(33, 150, 243, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(33, 150, 243, 1)',
        pointRadius: 4,
      }]
    };
  }, [styleProfile]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: '#666',
        },
        ticks: {
          display: false,
          stepSize: 20,
        },
        suggestedMin: 0,
        suggestedMax: 100,
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${Math.round(context.raw)}%`;
          }
        }
      }
    }
  };

  return (
    <div className="style-dna">
      <div className="style-dna__header">
        <h3 className="style-dna__title">Clone's Style DNA</h3>
        <p className="style-dna__subtitle">
          Evolving personality after {gamesPlayed || 0} game{gamesPlayed !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="style-dna__chart">
        <Radar data={metrics} options={options} height={250} />
      </div>
      <div className="style-dna__legend">
        <div className="style-dna__legend-item">
          <span className="style-dna__legend-dot" style={{ background: 'rgba(33, 150, 243, 1)' }}></span>
          <span>Current Style Profile</span>
        </div>
      </div>
    </div>
  );
};

export default StyleDNA;
