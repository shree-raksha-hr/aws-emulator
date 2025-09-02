import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const RDSDetails = () => {
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
                const response = await axios.get(`http://localhost:8000/rds/${instanceId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setInstance(response.data);
            } catch (err) {
                console.error('Error fetching instance:', err);
            }
        };

        fetchInstance();
    }, [instanceId, navigate]);

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/rds/${instanceId}`, {
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
            <h1>RDS Instance Details</h1>
            <p><strong>ID:</strong> {instance.instance_id}</p>
            <p><strong>Identifier:</strong> {instance.identifier}</p>
            <p><strong>Username:</strong> {instance.username}</p>
            <p><strong>Password:</strong> {instance.password}</p>
            <p><strong>Endpoint:</strong> {instance.endpoint}</p>
            <p><strong>Port:</strong> {instance.port}</p>
            <p><strong>Engine:</strong> {instance.engine}</p>
            <p><strong>Status:</strong> {instance.status}</p>
            <button onClick={handleDelete}>Delete</button>
            <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
    );
};

export default RDSDetails;