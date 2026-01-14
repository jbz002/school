import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import M2Page from './pages/M2/M2Page';
import M3Page from './pages/M3/M3Page';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/m2" element={<M2Page />} />
          <Route path="/m3" element={<M3Page />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
