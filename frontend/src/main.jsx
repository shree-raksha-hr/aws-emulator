
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EC2Detail from './components/EC2Detail';
import S3Detail from './components/S3Detail';
import RDSDetail from './components/RDSDetail';
import S3Main from './components/S3Main';
import RDSMain from './components/RDSMain';
import EC2Main from './components/EC2Main';

const App = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ec2/:instanceId" element={<EC2Detail />} />
            <Route path="/s3/:bucketName" element={<S3Detail />} />
            <Route path="/ec2main" element={<EC2Main />} />
            <Route path="/s3main" element={<S3Main />} />
            <Route path="/rdsmain" element={<RDSMain />} />
            <Route path="/rds/:instanceId" element={<RDSDetail />} />
        </Routes>
    </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
