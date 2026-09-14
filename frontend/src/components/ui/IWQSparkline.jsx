import { useMemo, useState } from 'react';
import '../../styles/IWQSparkline.css';

/**
 * A lightweight, responsive SVG sparkline for displaying the 12-month IWQ trend.
 * @param {Object} props
 * @param {Array} props.data - Array of { month, iwq_percentage }
 * @param {number} props.height - Fixed height in pixels
 * @param {number} props.width - Fixed width in pixels (or use responsive container if omitted)
 */
export default function IWQSparkline({ data = [], height = 60, width = null }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const points = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sparkline uses a 0-100 scale for Y-axis since IWQ is a percentage
    // X-axis will be distributed evenly based on the array index
    
    // Reverse data if it came in descending order (we want newest on the right)
    // We expect it to be ascending here.
    
    const count = data.length;
    return data.map((d, i) => {
      // x: 0 to 100 percentage of width
      const xPct = count > 1 ? (i / (count - 1)) * 100 : 50;
      // y: 0 to 100 percentage of height (inverted because SVG Y goes down)
      const yPct = 100 - (d.iwq_percentage || 0);
      return {
        xPct,
        yPct,
        ...d
      };
    });
  }, [data]);

  if (points.length === 0) return null;

  // Build the SVG path
  const pathD = points.length === 1
    ? `M 0,${points[0].yPct} L 100,${points[0].yPct}`
    : `M ${points.map(p => `${p.xPct},${p.yPct}`).join(' L ')}`;

  // Area path for the fill (closes down to the bottom)
  const areaD = points.length === 1
    ? `M 0,100 L 0,${points[0].yPct} L 100,${points[0].yPct} L 100,100 Z`
    : `${pathD} L 100,100 L 0,100 Z`;

  // Determine container style
  const containerStyle = {
    ...(width ? { width: `${width}px` } : { width: '100%' })
  };

  const svgWrapperStyle = {
    height: `${height}px`
  };

  const latestVal = points[points.length - 1].iwq_percentage;

  return (
    <div className="iwq-sparkline-container" style={containerStyle}>
      <div className="iwq-sparkline-header">
        <span className="iwq-sparkline-title">12-Month Trend</span>
        <span className="iwq-sparkline-latest">{latestVal}%</span>
      </div>
      <div className="iwq-sparkline-svg-wrapper" style={svgWrapperStyle}>
        <svg
          className="iwq-sparkline-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Fill Area */}
          <path d={areaD} className="iwq-sparkline-area" />
          
          {/* Stroke Line */}
          <path d={pathD} className="iwq-sparkline-line" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* Interactive Dots (HTML instead of SVG to avoid aspect-ratio distortion) */}
        {points.map((p, i) => {
          const isHovered = hoverIndex === i;
          return (
            <div
              key={i}
              className={`iwq-sparkline-dot ${isHovered ? 'hovered' : ''}`}
              style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          );
        })}


        
        {/* Tooltip */}
        {hoverIndex !== null && (
          <div 
            className="iwq-sparkline-tooltip"
            style={{ 
              left: `${points[hoverIndex].xPct}%`,
              bottom: `calc(${100 - points[hoverIndex].yPct}% + 10px)`
            }}
          >
            <div className="iwq-sparkline-tooltip-month">
              {new Date(points[hoverIndex].month).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </div>
            <div className="iwq-sparkline-tooltip-val">
              {points[hoverIndex].iwq_percentage}% Foundation
            </div>
            <div className="iwq-sparkline-tooltip-detail">
              {points[hoverIndex].foundation_entries} / {points[hoverIndex].total_entries} entries
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
