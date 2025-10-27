import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

const Tooltip = ({ children, content }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const showTooltip = useCallback(() => {
    if (!triggerRef.current || !content) return;
    setVisible(true);
  }, [content]);

  const hideTooltip = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (visible && tooltipRef.current && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = triggerRect.top - tooltipRect.height - 8; // 8px gap above
      let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);

      // Top collision detection
      if (top < 8) {
        top = triggerRect.bottom + 8; // Move below
      }

      // Left/Right collision detection
      if (left < 8) {
        left = 8;
      } else if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }

      setPosition({ top, left });
    }
  }, [visible]);

  return (
    <>
      {/* FIX: Replaced React.cloneElement with a wrapper div to safely attach event listeners and ref.
          This is a more robust way to handle tooltips for arbitrary children and avoids TypeScript issues with ref forwarding. */}
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
      {visible && content && ReactDOM.createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-50 p-3 text-xs leading-relaxed text-slate-50 bg-slate-800 rounded-lg shadow-lg whitespace-pre-wrap max-w-sm transition-opacity duration-200"
          style={{ 
            ...position, 
            // Start with opacity 0 to prevent flickering on first render before position is calculated
            opacity: tooltipRef.current && position.top !== 0 ? 1 : 0, 
          }}
          role="tooltip"
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;