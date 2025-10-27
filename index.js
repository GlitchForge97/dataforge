import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, TrendingUp, BarChart3, Activity, Download, Filter, RefreshCw, Database } from 'lucide-react';

const DataForgeInsights = () => {
  const [data, setData] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [chartType, setChartType] = useState('line');
  const [filterValue, setFilterValue] = useState('');
  const [sortColumn, setSortColumn] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isAnimating, setIsAnimating] = useState(false);

  // Sample dataset
  const sampleData = [
    { month: 'Jan', revenue: 4200, expenses: 2400, customers: 145, satisfaction: 4.2 },
    { month: 'Feb', revenue: 3800, expenses: 2100, customers: 138, satisfaction: 4.1 },
    { month: 'Mar', revenue: 5100, expenses: 2800, customers: 167, satisfaction: 4.4 },
    { month: 'Apr', revenue: 6300, expenses: 3200, customers: 189, satisfaction: 4.5 },
    { month: 'May', revenue: 5800, expenses: 2900, customers: 178, satisfaction: 4.3 },
    { month: 'Jun', revenue: 7200, expenses: 3500, customers: 210, satisfaction: 4.6 },
    { month: 'Jul', revenue: 8100, expenses: 3800, customers: 235, satisfaction: 4.7 },
    { month: 'Aug', revenue: 7800, expenses: 3600, customers: 228, satisfaction: 4.6 },
    { month: 'Sep', revenue: 6900, expenses: 3300, customers: 201, satisfaction: 4.5 },
    { month: 'Oct', revenue: 7500, expenses: 3700, customers: 218, satisfaction: 4.6 },
    { month: 'Nov', revenue: 8300, expenses: 4000, customers: 242, satisfaction: 4.8 },
    { month: 'Dec', revenue: 9200, expenses: 4300, customers: 268, satisfaction: 4.9 }
  ];

  useEffect(() => {
    setData(sampleData);
    setSelectedColumns(['revenue', 'expenses']);
  }, []);

  // Statistical calculations
  const calculateStats = (values) => {
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    const median = values.length % 2 === 0
      ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
      : sorted[Math.floor(values.length / 2)];
    
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const mode = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    const maxFreq = Math.max(...Object.values(mode));
    const modes = Object.keys(mode).filter(key => mode[key] === maxFreq).map(Number);
    
    return {
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      mode: modes[0].toFixed(2),
      variance: variance.toFixed(2),
      stdDev: stdDev.toFixed(2),
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      range: (Math.max(...values) - Math.min(...values)).toFixed(2)
    };
  };

  // Linear regression
  const calculateRegression = (xValues, yValues) => {
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  };

  // Correlation coefficient
  const calculateCorrelation = (xValues, yValues) => {
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return numerator / denominator;
  };

  const numericColumns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(key => typeof data[0][key] === 'number');
  }, [data]);

  const processedData = useMemo(() => {
    let filtered = [...data];
    
    if (filterValue && sortColumn) {
      filtered = filtered.filter(row => 
        row[sortColumn]?.toString().toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }
    
    return filtered;
  }, [data, filterValue, sortColumn, sortOrder]);

  const insights = useMemo(() => {
    if (selectedColumns.length === 0) return null;
    
    const columnValues = selectedColumns.map(col => 
      processedData.map(row => row[col]).filter(val => typeof val === 'number')
    );
    
    const stats = selectedColumns.map((col, idx) => ({
      column: col,
      stats: calculateStats(columnValues[idx])
    }));
    
    let correlation = null;
    let regression = null;
    
    if (selectedColumns.length === 2) {
      correlation = calculateCorrelation(columnValues[0], columnValues[1]);
      regression = calculateRegression(columnValues[0], columnValues[1]);
    }
    
    return { stats, correlation, regression };
  }, [processedData, selectedColumns]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (file.name.endsWith('.json')) {
          const jsonData = JSON.parse(event.target.result);
          setData(Array.isArray(jsonData) ? jsonData : [jsonData]);
        } else if (file.name.endsWith('.csv')) {
          const text = event.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          const parsed = lines.slice(1).map(line => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((header, idx) => {
              const val = values[idx]?.trim();
              obj[header] = isNaN(val) ? val : parseFloat(val);
            });
            return obj;
          });
          setData(parsed);
        }
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 500);
      } catch (err) {
        console.error('Error parsing file:', err);
      }
    };
    reader.readAsText(file);
  };

  const loadSampleData = () => {
    setData(sampleData);
    setSelectedColumns(['revenue', 'expenses']);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">DataForge Insights</h1>
                <p className="text-sm text-slate-500">Advanced Analytics Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all flex items-center gap-2 text-sm font-medium">
                <Upload className="w-4 h-4" />
                Upload Data
                <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
              </label>
              <button onClick={loadSampleData} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all flex items-center gap-2 text-sm font-medium">
                <Database className="w-4 h-4" />
                Sample Data
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls */}
        {data.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Columns</label>
                <div className="space-y-2">
                  {numericColumns.map(col => (
                    <label key={col} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(col)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColumns([...selectedColumns, col]);
                          } else {
                            setSelectedColumns(selectedColumns.filter(c => c !== col));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-slate-700 capitalize">{col}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chart Type</label>
                <select 
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="scatter">Scatter Plot</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sort & Filter</label>
                <select 
                  value={sortColumn} 
                  onChange={(e) => setSortColumn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">No Sort</option>
                  {numericColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                {sortColumn && (
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="w-full px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all text-sm"
                  >
                    {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Insights Cards */}
        {insights && (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            {insights.stats.map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700 capitalize">{stat.column}</h3>
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Mean:</span>
                    <span className="font-semibold text-slate-700">{stat.stats.mean}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Median:</span>
                    <span className="font-semibold text-slate-700">{stat.stats.median}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Std Dev:</span>
                    <span className="font-semibold text-slate-700">{stat.stats.stdDev}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Range:</span>
                    <span className="font-semibold text-slate-700">{stat.stats.range}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {insights.correlation !== null && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm p-5 text-white hover:shadow-md transition-all">
                <h3 className="text-sm font-semibold mb-3">Correlation</h3>
                <div className="text-3xl font-bold mb-2">{insights.correlation.toFixed(3)}</div>
                <p className="text-xs opacity-90">
                  {Math.abs(insights.correlation) > 0.7 ? 'Strong' : Math.abs(insights.correlation) > 0.4 ? 'Moderate' : 'Weak'} 
                  {insights.correlation > 0 ? ' positive' : ' negative'} relationship
                </p>
              </div>
            )}
            
            {insights.regression !== null && (
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-sm p-5 text-white hover:shadow-md transition-all">
                <h3 className="text-sm font-semibold mb-3">Linear Regression</h3>
                <div className="text-xs space-y-1">
                  <div>Slope: <span className="font-bold">{insights.regression.slope.toFixed(3)}</span></div>
                  <div>Intercept: <span className="font-bold">{insights.regression.intercept.toFixed(3)}</span></div>
                  <div className="mt-2 opacity-90">y = {insights.regression.slope.toFixed(2)}x + {insights.regression.intercept.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        {data.length > 0 && selectedColumns.length > 0 && (
          <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Visual Analysis</h2>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>
            
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'line' && (
                <LineChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {selectedColumns.map((col, idx) => (
                    <Line 
                      key={col} 
                      type="monotone" 
                      dataKey={col} 
                      stroke={colors[idx % colors.length]} 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={800}
                    />
                  ))}
                </LineChart>
              )}
              
              {chartType === 'bar' && (
                <BarChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {selectedColumns.map((col, idx) => (
                    <Bar 
                      key={col} 
                      dataKey={col} 
                      fill={colors[idx % colors.length]}
                      animationDuration={800}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              )}
              
              {chartType === 'scatter' && selectedColumns.length >= 2 && (
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey={selectedColumns[0]} stroke="#64748b" style={{ fontSize: '12px' }} name={selectedColumns[0]} />
                  <YAxis dataKey={selectedColumns[1]} stroke="#64748b" style={{ fontSize: '12px' }} name={selectedColumns[1]} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} cursor={{ strokeDasharray: '3 3' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Scatter name="Data Points" data={processedData} fill={colors[0]} animationDuration={800} />
                </ScatterChart>
              )}
              
              {chartType === 'pie' && selectedColumns.length === 1 && (
                <PieChart>
                  <Pie
                    data={processedData}
                    dataKey={selectedColumns[0]}
                    nameKey="month"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                    animationDuration={800}
                  >
                    {processedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Empty State */}
        {data.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Data Loaded</h3>
            <p className="text-sm text-slate-500 mb-6">Upload a CSV or JSON file, or load sample data to begin analysis</p>
            <button onClick={loadSampleData} className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all font-medium">
              Load Sample Dataset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataForgeInsights;
