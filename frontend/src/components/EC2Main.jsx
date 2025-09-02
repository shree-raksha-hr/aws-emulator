import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const EC2Main = () => {
    const [instances, setInstances] = useState([]);
    const [newInstance, setNewInstance] = useState({
        identifier: '',
        ami_id: 'alpine:latest',
        instance_type: 't2.micro'
    });
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [terminalVisible, setTerminalVisible] = useState(false);
    const terminalRef = useRef(null);
    const wsRef = useRef(null);
    const xtermRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        fetchInstances();

        // Initialize xterm.js terminal with FitAddon
        xtermRef.current = new Terminal({
            cursorBlink: true,
            theme: { background: '#000000', foreground: '#FFFFFF' },
            fontSize: 14
        });
        const fitAddon = new FitAddon();
        xtermRef.current.loadAddon(fitAddon);

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (xtermRef.current) {
                xtermRef.current.dispose();
            }
        };
    }, [navigate]);

    const fetchInstances = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/ec2/instances', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInstances(response.data.instances);
        } catch (err) {
            console.error('Error fetching instances:', err);
            alert(err.response?.data?.detail || 'Error fetching instances');
        }
    };

    const fetchInstance = async (instanceId) => {
        try {
            const token = localStorage.getItem('token');
            console.log(`Fetching instance with ID: ${instanceId}`); // Debug log
            const response = await axios.get(`http://localhost:8000/ec2/instances/${instanceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedInstance(response.data);
        } catch (err) {
            console.error('Error fetching instance:', err);
            const message = err.response?.status === 405
                ? 'Method Not Allowed: Ensure the backend endpoint /ec2/instances/{instance_id} supports GET requests'
                : err.response?.data?.detail || 'Error fetching instance';
            alert(message);
            setSelectedInstance(null);
        }
    };

    const handleCreateInstance = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8000/ec2/instances',
                newInstance,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewInstance({ identifier: '', ami_id: 'alpine:latest', instance_type: 't2.micro' });
            fetchInstances();
        } catch (err) {
            console.error('Error creating instance:', err);
            alert(err.response?.data?.detail || 'Error creating instance');
        }
    };

    const handleStartInstance = async (instanceId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8000/ec2/instances/${instanceId}/start`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchInstances();
            if (selectedInstance && selectedInstance.instance_id === instanceId) {
                fetchInstance(instanceId);
            }
        } catch (err) {
            console.error('Error starting instance:', err);
            alert(err.response?.data?.detail || 'Error starting instance');
        }
    };

    const handleStopInstance = async (instanceId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8000/ec2/instances/${instanceId}/stop`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchInstances();
            if (selectedInstance && selectedInstance.instance_id === instanceId) {
                fetchInstance(instanceId);
            }
        } catch (err) {
            console.error('Error stopping instance:', err);
            alert(err.response?.data?.detail || 'Error stopping instance');
        }
    };

    const handleDeleteInstance = async (instanceId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/ec2/instances/${instanceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedInstance(null);
            setTerminalVisible(false);
            fetchInstances();
        } catch (err) {
            console.error('Error deleting instance:', err);
            alert(err.response?.data?.detail || 'Error deleting instance');
        }
    };

    const connectTerminal = (instanceId) => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        const token = localStorage.getItem('token');
        const websocket = new WebSocket(`ws://localhost:8000/ec2/instances/${instanceId}/console?token=${token}`);

        websocket.onopen = () => {
            if (terminalRef.current && xtermRef.current) {
                xtermRef.current.open(terminalRef.current);
                xtermRef.current.getAddon('fit').fit();
                xtermRef.current.write('Connected to console. Type "exit" to disconnect.\r\n');
                setTerminalVisible(true);
            }
        };

        websocket.onmessage = (event) => {
            if (xtermRef.current) {
                xtermRef.current.write(event.data);
            }
        };

        websocket.onclose = () => {
            if (xtermRef.current) {
                xtermRef.current.write('\r\nConnection closed.\r\n');
            }
            setTerminalVisible(false);
            wsRef.current = null;
        };

        websocket.onerror = (event) => {
            console.error('WebSocket error:', event);
            if (xtermRef.current) {
                xtermRef.current.write('\r\nError connecting to console. Ensure the instance is running and token is valid.\r\n');
            }
            setTerminalVisible(false);
            wsRef.current = null;
        };

        xtermRef.current.onData((data) => {
            if (websocket.readyState === WebSocket.OPEN) {
                websocket.send(data);
            }
        });

        wsRef.current = websocket;
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">EC2 Management</h1>

            {/* Create Instance */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Create New EC2 Instance</h2>
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        value={newInstance.identifier}
                        onChange={(e) => setNewInstance({ ...newInstance, identifier: e.target.value })}
                        placeholder="Instance identifier"
                        className="border p-2 rounded"
                    />
                    <input
                        type="text"
                        value={newInstance.ami_id}
                        onChange={(e) => setNewInstance({ ...newInstance, ami_id: e.target.value })}
                        placeholder="AMI ID (e.g., alpine:latest)"
                        className="border p-2 rounded"
                    />
                    <select
                        value={newInstance.instance_type}
                        onChange={(e) => setNewInstance({ ...newInstance, instance_type: e.target.value })}
                        className="border p-2 rounded"
                    >
                        <option value="t2.micro">t2.micro</option>
                        <option value="t2.small">t2.small</option>
                        <option value="t2.medium">t2.medium</option>
                    </select>
                    <button
                        onClick={handleCreateInstance}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Create Instance
                    </button>
                </div>
            </div>

            {/* List Instances */}
            <h2 className="text-xl font-semibold mb-2">EC2 Instances</h2>
            {instances.length === 0 ? (
                <p>No instances found.</p>
            ) : (
                <ul className="space-y-2">
                    {instances.map((instance) => (
                        <li key={instance.instance_id} className="border p-4 rounded flex justify-between items-center">
                            <div>
                                <span className="font-medium">{instance.identifier}</span>
                                <p className="text-sm text-gray-600">
                                    AMI: {instance.ami_id} | Type: {instance.instance_type} | Status: {instance.status}
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



                                {instance.status === 'running' ? (
                                    <button
                                        onClick={() => handleStopInstance(instance.instance_id)}
                                        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                                    >
                                        Stop
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleStartInstance(instance.instance_id)}
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                    >
                                        Start
                                    </button>
                                )}
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
                        <p className="text-sm text-gray-600">Instance ID: {selectedInstance.instance_id}</p>
                        <p className="text-sm text-gray-600">AMI ID: {selectedInstance.ami_id}</p>
                        <p className="text-sm text-gray-600">Instance Type: {selectedInstance.instance_type}</p>
                        <p className="text-sm text-gray-600">Status: {selectedInstance.status}</p>
                        <p className="text-sm text-gray-600">
                            Created At: {new Date(selectedInstance.created_at).toLocaleString()}
                        </p>
                        {selectedInstance.status === 'running' && (
                            <button
                                onClick={() => connectTerminal(selectedInstance.instance_id)}
                                className="mt-2 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                            >
                                Open Terminal
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Terminal */}
            {terminalVisible && (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-2">Terminal</h2>
                    <div ref={terminalRef} className="bg-black p-4 rounded h-64"></div>
                    <button
                        onClick={() => {
                            if (wsRef.current) {
                                wsRef.current.close();
                            }
                            setTerminalVisible(false);
                        }}
                        className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Close Terminal
                    </button>
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

export default EC2Main;