import { useEffect, useRef } from 'react';

const TableauDashboard = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://public.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js';
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <tableau-viz
        src="https://public.tableau.com/views/snap_17747406098400/Dashboard1"
        width="100%"
        height="850"
        hide-tabs="true"
        toolbar="bottom"
      />
    </div>
  );
};

export default TableauDashboard;