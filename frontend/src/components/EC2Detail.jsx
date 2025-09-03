import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EC2Details = () => {
    const { instanceId } = useParams();
    const [instance, setInstance] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        const fetchInstance = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/ec2/instances`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const instanceData = response.data.instances.find(
                    (inst) => inst.instance_id === instanceId
                );
                setInstance(instanceData);
            } catch (err) {
                console.error('Error fetching instance:', err);
            }
        };

        fetchInstance();
    }, [instanceId, navigate]);

    const handleStart = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:8000/ec2/instances/${instanceId}/start`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInstance({ ...instance, status: 'running' });
        } catch (err) {
            console.error('Error starting instance:', err);
        }
    };

    const handleStop = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:8000/ec2/instances/${instanceId}/stop`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInstance({ ...instance, status: 'stopped' });
        } catch (err) {
            console.error('Error stopping instance:', err);
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/ec2/instances/${instanceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/dashboard');
        } catch (err) {
            console.error('Error deleting instance:', err);
        }
    };

    if (!instance) return <div>Loading...</div>;

    return (
        <div>
            <h1>EC2 Instance Details</h1>
            <p><strong>ID:</strong> {instance.instance_id}</p>
            <p><strong>Identifier:</strong> {instance.identifier}</p>
            <p><strong>AMI ID:</strong> {instance.ami_id}</p>
            <p><strong>Instance Type:</strong> {instance.instance_type}</p>
            <p><strong>Status:</strong> {instance.status}</p>
            <button onClick={handleStart} disabled={instance.status === 'running'}>Start</button>
            <button onClick={handleStop} disabled={instance.status === 'stopped'}>Stop</button>
            <button onClick={handleDelete}>Delete</button>
            <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
    );
};

export default EC2Details;