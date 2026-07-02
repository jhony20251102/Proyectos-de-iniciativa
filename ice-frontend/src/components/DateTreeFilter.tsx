import { useState, useEffect, useRef } from 'react';

interface DateTreeFilterProps {
  dates: string[]; 
  onFilterChange: (selectedYMD: { year: number; month: number; day: number }[]) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function DateTreeFilter({ dates, onFilterChange }: DateTreeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  
  const tree: Record<number, Record<number, number[]>> = {};
  dates.forEach(d => {
    if (!d) return;
    const date = new Date(d);
    if (isNaN(date.getTime())) return;
    const y = date.getFullYear();
    const m = date.getMonth();
    const day = date.getDate();
    if (!tree[y]) tree[y] = {};
    if (!tree[y][m]) tree[y][m] = [];
    if (!tree[y][m].includes(day)) tree[y][m].push(day);
  });
  
  
  const years = Object.keys(tree).map(Number).sort((a, b) => b - a);
  years.forEach(y => {
    
    const months = Object.keys(tree[y]).map(Number).sort((a, b) => a - b);
    const newMonthObj: Record<number, number[]> = {};
    months.forEach(m => {
      
      newMonthObj[m] = tree[y][m].sort((a, b) => a - b);
    });
    tree[y] = newMonthObj;
  });

  
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  
  
  const [selectedYMD, setSelectedYMD] = useState<{ year: number; month: number; day: number }[]>([]);

  
  useEffect(() => {
    const all: { year: number; month: number; day: number }[] = [];
    years.forEach(y => {
      Object.keys(tree[y]).forEach(mStr => {
        const m = Number(mStr);
        tree[y][m].forEach(day => {
          all.push({ year: y, month: m, day });
        });
      });
    });
    setSelectedYMD(all);
    
    
    const expandYState: Record<number, boolean> = {};
    const expandMState: Record<string, boolean> = {};
    years.forEach(y => {
      expandYState[y] = true;
      Object.keys(tree[y]).forEach(mStr => {
        expandMState[`${y}-${mStr}`] = true;
      });
    });
    setExpandedYears(expandYState);
    setExpandedMonths(expandMState);
    
    
  }, [dates.length]); 

  useEffect(() => {
    onFilterChange(selectedYMD);
  }, [selectedYMD]);

  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleYearExpand = (y: number) => {
    setExpandedYears(prev => ({ ...prev, [y]: !prev[y] }));
  };

  const toggleMonthExpand = (y: number, m: number) => {
    setExpandedMonths(prev => ({ ...prev, [`${y}-${m}`]: !prev[`${y}-${m}`] }));
  };

  const isDaySelected = (y: number, m: number, d: number) => {
    return selectedYMD.some(item => item.year === y && item.month === m && item.day === d);
  };

  const isMonthSelected = (y: number, m: number) => {
    const totalDays = tree[y][m]?.length || 0;
    const selectedCount = selectedYMD.filter(item => item.year === y && item.month === m).length;
    if (selectedCount === 0) return false;
    if (selectedCount === totalDays) return true;
    return 'indeterminate';
  };

  const isYearSelected = (y: number) => {
    let totalDays = 0;
    Object.keys(tree[y]).forEach(mStr => {
      totalDays += tree[y][Number(mStr)].length;
    });
    const selectedCount = selectedYMD.filter(item => item.year === y).length;
    if (selectedCount === 0) return false;
    if (selectedCount === totalDays) return true;
    return 'indeterminate';
  };

  const isAllSelected = () => {
    let total = 0;
    years.forEach(y => {
      Object.keys(tree[y]).forEach(mStr => {
        total += tree[y][Number(mStr)].length;
      });
    });
    if (selectedYMD.length === 0) return false;
    if (selectedYMD.length === total) return true;
    return 'indeterminate';
  };

  const handleToggleDay = (y: number, m: number, d: number) => {
    setSelectedYMD(prev => {
      if (isDaySelected(y, m, d)) {
        return prev.filter(item => !(item.year === y && item.month === m && item.day === d));
      } else {
        return [...prev, { year: y, month: m, day: d }];
      }
    });
  };

  const handleToggleMonth = (y: number, m: number) => {
    const status = isMonthSelected(y, m);
    if (status === true) {
      setSelectedYMD(prev => prev.filter(item => !(item.year === y && item.month === m)));
    } else {
      setSelectedYMD(prev => {
        const next = prev.filter(item => !(item.year === y && item.month === m));
        tree[y][m].forEach(d => next.push({ year: y, month: m, day: d }));
        return next;
      });
    }
  };

  const handleToggleYear = (y: number) => {
    const status = isYearSelected(y);
    if (status === true) {
      setSelectedYMD(prev => prev.filter(item => item.year !== y));
    } else {
      setSelectedYMD(prev => {
        const next = prev.filter(item => item.year !== y);
        Object.keys(tree[y]).forEach(mStr => {
          const m = Number(mStr);
          tree[y][m].forEach(d => next.push({ year: y, month: m, day: d }));
        });
        return next;
      });
    }
  };

  const handleToggleAll = () => {
    const status = isAllSelected();
    if (status === true) {
      setSelectedYMD([]);
    } else {
      const all: { year: number; month: number; day: number }[] = [];
      years.forEach(y => {
        Object.keys(tree[y]).forEach(mStr => {
          const m = Number(mStr);
          tree[y][m].forEach(d => all.push({ year: y, month: m, day: d }));
        });
      });
      setSelectedYMD(all);
    }
  };

  
  const getSelectedSummary = () => {
    const totalSelected = selectedYMD.length;
    return `${totalSelected} días selec.`;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: '1px solid var(--border-color)', padding: '0.4rem 0.5rem', 
          borderRadius: '4px', background: 'white', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.85rem'
        }}
      >
        <span>{getSelectedSummary()}</span>
        <span style={{ fontSize: '0.7rem' }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '4px',
          background: 'white', border: '1px solid var(--border-color)',
          borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 50, minWidth: '200px', maxHeight: '350px', overflowY: 'auto',
          padding: '8px', color: 'var(--text-main)', fontSize: '0.85rem'
        }}>
          {years.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: '4px' }}>Sin fechas</div>
          ) : (
            <>
              {}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={isAllSelected() === true}
                  ref={input => { if (input) input.indeterminate = isAllSelected() === 'indeterminate'; }}
                  onChange={handleToggleAll} 
                  style={{ marginRight: '6px' }}
                />
                <span onClick={handleToggleAll} style={{ cursor: 'pointer', fontWeight: 600 }}>(Seleccionar todo)</span>
              </div>

              {}
              {years.map(y => (
                <div key={y} style={{ marginLeft: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <span 
                      onClick={() => toggleYearExpand(y)}
                      style={{ cursor: 'pointer', width: '16px', display: 'inline-block', border: '1px solid #ccc', textAlign: 'center', lineHeight: '12px', fontSize: '10px', height: '14px', marginRight: '6px' }}
                    >
                      {expandedYears[y] ? '-' : '+'}
                    </span>
                    <input 
                      type="checkbox" 
                      checked={isYearSelected(y) === true}
                      ref={input => { if (input) input.indeterminate = isYearSelected(y) === 'indeterminate'; }}
                      onChange={() => handleToggleYear(y)} 
                      style={{ marginRight: '6px' }}
                    />
                    <span onClick={() => handleToggleYear(y)} style={{ cursor: 'pointer', fontWeight: 500 }}>{y}</span>
                  </div>

                  {}
                  {expandedYears[y] && (
                    <div style={{ marginLeft: '22px' }}>
                      {Object.keys(tree[y]).map(Number).map(m => (
                        <div key={`${y}-${m}`}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ color: '#ccc', marginRight: '4px' }}>├</span>
                            <span 
                              onClick={() => toggleMonthExpand(y, m)}
                              style={{ cursor: 'pointer', width: '14px', display: 'inline-block', border: '1px solid #ccc', textAlign: 'center', lineHeight: '10px', fontSize: '8px', height: '12px', marginRight: '6px' }}
                            >
                              {expandedMonths[`${y}-${m}`] ? '-' : '+'}
                            </span>
                            <input 
                              type="checkbox" 
                              checked={isMonthSelected(y, m) === true}
                              ref={input => { if (input) input.indeterminate = isMonthSelected(y, m) === 'indeterminate'; }}
                              onChange={() => handleToggleMonth(y, m)} 
                              style={{ marginRight: '6px' }}
                            />
                            <span onClick={() => handleToggleMonth(y, m)} style={{ cursor: 'pointer' }}>{MONTH_NAMES[m]}</span>
                          </div>

                          {}
                          {expandedMonths[`${y}-${m}`] && (
                            <div style={{ marginLeft: '26px' }}>
                              {tree[y][m].map(d => (
                                <div key={`${y}-${m}-${d}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ color: '#ccc', marginRight: '4px' }}>├</span>
                                  <input 
                                    type="checkbox" 
                                    checked={isDaySelected(y, m, d)} 
                                    onChange={() => handleToggleDay(y, m, d)} 
                                    style={{ marginRight: '6px' }}
                                  />
                                  <span onClick={() => handleToggleDay(y, m, d)} style={{ cursor: 'pointer' }}>{d}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

