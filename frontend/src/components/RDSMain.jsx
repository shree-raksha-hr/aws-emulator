import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RDSMain = () => {
    const [instances, setInstances] = useState([]);
    const [newInstance, setNewInstance] = useState({
        identifier: '',
        engine: 'postgres',
        username: '',
        password: ''
    });
    const [selectedInstance, setSelectedInstance] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        fetchInstances();
    }, [navigate]);

    const fetchInstances = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/rds/', {
                headers: { Authorization: `Bearer ${token} ` }
            });
            setInstances(response.data);
        } catch (err) {
            console.error('Error fetching instances:', err);
            alert(err.response?.data?.detail || 'Error fetching instances');
        }
    };

    const fetchInstance = async (instanceId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8000/rds/${instanceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedInstance(response.data);
        } catch (err) {
            console.error('Error fetching instance:', err);
            alert(err.response?.data?.detail || 'Error fetching instance');
            setSelectedInstance(null);
        }
    };

    const handleCreateInstance = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8000/rds/',
                newInstance,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewInstance({ identifier: '', engine: 'postgres', username: '', password: '' });
            fetchInstances();
        } catch (err) {
            console.error('Error creating instance:', err);
            alert(err.response?.data?.detail || 'Error creating instance');
        }
    };

    const handleDeleteInstance = async (instanceId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/rds/${instanceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedInstance(null);
            fetchInstances();
        } catch (err) {
            console.error('Error deleting instance:', err);
            alert(err.response?.data?.detail || 'Error deleting instance');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">RDS Management</h1>

            {/* Create Instance */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Create New Database Instance</h2>
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        value={newInstance.identifier}
                        onChange={(e) => setNewInstance({ ...newInstance, identifier: e.target.value })}
                        placeholder="Instance identifier"
                        className="border p-2 rounded"
                    />
                    <select
                        value={newInstance.engine}
                        onChange={(e) => setNewInstance({ ...newInstance, engine: e.target.value })}
                        className="border p-2 rounded"
                    >
                        <option value="postgres">PostgreSQL</option>
                        <option value="mysql">MySQL</option>
                    </select>
                    <input
                        type="text"
                        value={newInstance.username}
                        onChange={(e) => setNewInstance({ ...newInstance, username: e.target.value })}
                        placeholder="Username"
                        className="border p-2 rounded"
                    />
                    <input
                        type="password"
                        value={newInstance.password}
                        onChange={(e) => setNewInstance({ ...newInstance, password: e.target.value })}
                        placeholder="Password"
                        className="border p-2 rounded"
                    />
                    <button
                        onClick={handleCreateInstance}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Create Instance
                    </button>
                </div>
            </div>

            {/* List Instances */}
            <h2 className="text-xl font-semibold mb-2">Database Instances</h2>
            {instances.length === 0 ? (
                <p>No instances found.</p>
            ) : (
                <ul className="space-y-2">
                    {instances.map((instance) => (
                        <li key={instance.instance_id} className="border p-4 rounded flex justify-between items-center">
                            <div>
                                <span className="font-medium">{instance.identifier}</span>
                                <p className="text-sm text-gray-600">
                                    Engine: {instance.engine} | Status: {instance.status}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Endpoint: {instance.endpoint}:{instance.port}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Created: {new Date(instance.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchInstance(instance.instance_id)}
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => handleDeleteInstance(instance.instance_id)}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Instance Details */}
            {selectedInstance && (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-2">Instance: {selectedInstance.identifier}</h2>
                    <div className="border p-4 rounded">
                        <p className="text-sm text-gray-600">Engine: {selectedInstance.engine}</p>
                        <p className="text-sm text-gray-600">Status: {selectedInstance.status}</p>
                        <p className="text-sm text-gray-600">
                            Endpoint: {selectedInstance.endpoint}:{selectedInstance.port}
                        </p>
                        <p className="text-sm text-gray-600">Username: {selectedInstance.username}</p>
                        <p className="text-sm text-gray-600">Password: {selectedInstance.password}</p>
                        <p className="text-sm text-gray-600">
                            Created At: {new Date(selectedInstance.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}

            {/* Back to Dashboard */}
            <div className="mt-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default RDSMain;