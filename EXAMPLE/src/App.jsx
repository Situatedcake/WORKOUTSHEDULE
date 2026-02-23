import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import MainPage from './pages/MainPage';
import StartTrainingPage from './pages/StartTrainingPage';
import TrainingPage from './pages/TrainingPage';
import Layout from './components/Layout';

function App() {
  const [trainingData, setTrainingData] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MainPage />} />
          <Route 
            path="start-training" 
            element={<StartTrainingPage trainingData={trainingData} />} 
          />
          <Route 
            path="training" 
            element={<TrainingPage />} 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;