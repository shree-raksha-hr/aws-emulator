import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const S3Details = () => {
    const [buckets, setBuckets] = useState([]);
    const [newBucketName, setNewBucketName] = useState('');
    const [selectedBucket, setSelectedBucket] = useState(null);
    const [key, setKey] = useState('');
    const [data, setData] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        fetchBuckets();
    }, [navigate]);

    const fetchBuckets = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/s3/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBuckets(response.data);
        } catch (err) {
            console.error('Error fetching buckets:', err);
            alert(err.response?.data?.detail || 'Error fetching buckets');
        }
    };

    const fetchBucket = async (bucketName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8000/s3/${bucketName}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedBucket(response.data);
        } catch (err) {
            console.error('Error fetching bucket:', err);
            alert(err.response?.data?.detail || 'Error fetching bucket');
            setSelectedBucket(null);
        }
    };

    const handleCreateBucket = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8000/s3/',
                { name: newBucketName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewBucketName('');
            fetchBuckets();
        } catch (err) {
            console.error('Error creating bucket:', err);
            alert(err.response?.data?.detail || 'Error creating bucket');
        }
    };

    const handleUpload = async () => {
        if (!selectedBucket) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:8000/s3/${selectedBucket.name}/objects`,
                { key, data },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setKey('');
            setData('');
            fetchBucket(selectedBucket.name);
        } catch (err) {
            console.error('Error uploading object:', err);
            alert(err.response?.data?.detail || 'Error uploading object');
        }
    };

    const handleDeleteObject = async (objectKey) => {
        if (!selectedBucket) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/s3/buckets/${selectedBucket.name}/objects/${objectKey}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBucket(selectedBucket.name);
        } catch (err) {
            console.error('Error deleting object:', err);
            alert(err.response?.data?.detail || 'Error deleting object');
        }
    };

    const handleDeleteBucket = async (bucketName) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/s3/${bucketName}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedBucket(null);
            fetchBuckets();
        } catch (err) {
            console.error('Error deleting bucket:', err);
            alert(err.response?.data?.detail || 'Error deleting bucket');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">S3 Management</h1>

            {/* Create Bucket */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Create New Bucket</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newBucketName}
                        onChange={(e) => setNewBucketName(e.target.value)}
                        placeholder="Bucket name"
                        className="border p-2 rounded"
                    />
                    <button
                        onClick={handleCreateBucket}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Create Bucket
                    </button>
                </div>
            </div>

            {/* List Buckets */}
            <h2 className="text-xl font-semibold mb-2">Buckets</h2>
            {buckets.length === 0 ? (
                <p>No buckets found.</p>
            ) : (
                <ul className="space-y-2">
                    {buckets.map((bucket) => (
                        <li key={bucket.name} className="border p-4 rounded flex justify-between items-center">
                            <div>
                                <span className="font-medium">{bucket.name}</span>
                                <p className="text-sm text-gray-600">
                                    Created: {new Date(bucket.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchBucket(bucket.name)}
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => handleDeleteBucket(bucket.name)}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Bucket Details */}
            {selectedBucket && (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-2">Bucket: {selectedBucket.name}</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Created At: {new Date(selectedBucket.created_at).toLocaleString()}
                    </p>

                    {/* Upload Object */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Upload Object</h3>
                        <div className="flex flex-col gap-2 mb-4">
                            <input
                                type="text"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="Object key"
                                className="border p-2 rounded"
                            />
                            <textarea
                                value={data}
                                onChange={(e) => setData(e.target.value)}
                                placeholder="Object data"
                                className="border p-2 rounded"
                            />
                            <button
                                onClick={handleUpload}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Upload
                            </button>
                        </div>
                    </div>

                    {/* List Objects */}
                    <h3 className="text-lg font-semibold mb-2">Objects</h3>
                    {selectedBucket.objects.length === 0 ? (
                        <p>No objects in this bucket.</p>
                    ) : (
                        <ul className="space-y-2">
                            {selectedBucket.objects.map((obj) => (
                                <li key={obj.key} className="border p-4 rounded flex justify-between items-center">
                                    <div>
                                        <span className="font-medium">{obj.key}</span>
                                        <p className="text-sm text-gray-600">
                                            Created: {new Date(obj.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteObject(obj.key)}
                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
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

export default S3Details;